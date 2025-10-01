import { Injectable } from "@angular/core";
import { WeeklyMenu, Dish, DAYS_OF_WEEK } from "../models/interfaces";
import { WeeklyMenuService } from "./weekly-menu.service";
import { InventoryService } from "./inventory.service";
import { DishesService } from "./dishes.service";
import { signal, WritableSignal } from "@angular/core";
import { startOfWeek } from "date-fns";
import { es } from "date-fns/locale";

@Injectable({
  providedIn: "root",
})
export class MenuService {
  private currentMenuSignal: WritableSignal<WeeklyMenu | null> = signal(null);
  public currentMenu$ = this.currentMenuSignal;
  public currentMenu(): WeeklyMenu | null {
    return this.currentMenuSignal();
  }
  // Permitir acceso público al servicio de inventario
  public get inventoryServicePublic() {
    return this.inventoryService;
  }

  constructor(
    private weeklyMenuService: WeeklyMenuService,
    private inventoryService: InventoryService,
    private dishesService: DishesService
  ) {
    this.loadCurrentWeekMenu();
  }

  /**
   * Procesa advertencias y consume inventario para todos los platillos del menú semanal.
   * Actualiza el campo warnings en el menú y emite el cambio.
   */
  async processMenuWarnings(menu: WeeklyMenu): Promise<void> {
    if (!menu) return;
    menu.warnings = menu.warnings || {};
    for (const day of Object.keys(menu.days)) {
      menu.warnings[day] = menu.warnings[day] || {};
      for (const dish of menu.days[day]) {
        const meal = dish.category;
        const missingIds = await this.inventoryService.consumeIngredients(
          dish.ingredients
        );
        let missingIngredients: string[] = [];
        if (missingIds.length > 0) {
          const inventory = await this.inventoryService.getInventory();
          missingIngredients = missingIds.map((id) => {
            const inv = inventory.find((i) => i.id === id);
            return inv ? inv.name : id;
          });
        }
        menu.warnings[day][meal] = menu.warnings[day][meal] || {};
        menu.warnings[day][meal][dish.id] =
          missingIngredients.length > 0 ? missingIngredients : null;
      }
    }
    this.currentMenuSignal.set({ ...menu });
    await this.saveMenu(menu);
  }

  private getCurrentWeek(): string {
    // Usar date-fns para obtener el lunes de la semana actual
    const monday = startOfWeek(new Date(), { weekStartsOn: 1, locale: es });
    return monday.toISOString().split("T")[0];
  }

  private initializeEmptyWeek(week: string): WeeklyMenu {
    const days: { [day: string]: Dish[] } = {};
    for (const day of DAYS_OF_WEEK) {
      days[day] = [];
    }
    return {
      id: `menu-${week}`,
      week,
      days,
    };
  }

  async loadCurrentWeekMenu(): Promise<void> {
    const currentWeek = this.getCurrentWeek();
    let menu = await this.weeklyMenuService.getMenuByWeek(currentWeek);
    if (!menu) {
      menu = this.initializeEmptyWeek(currentWeek);
      await this.saveMenu(menu);
    }
    this.currentMenuSignal.set(menu);
    // NO recalcular inventario aquí
  }

  private async saveMenu(menu: WeeklyMenu): Promise<void> {
    await this.weeklyMenuService.saveMenu(menu);
  }

  getCurrentMenu(): WeeklyMenu | null {
    return this.currentMenuSignal();
  }

  /**
   * Agrega un platillo al menú y consume ingredientes del inventario.
   * Si no hay suficiente stock, marca el platillo como advertencia y permite agregarlo.
   * Devuelve un objeto con el estado de advertencia para la UI.
   */
  async addDishToMenu(
    day: string,
    meal: string,
    dishId: string
  ): Promise<{ warning: boolean; missingIngredients: string[] }> {
    const currentMenu = this.currentMenuSignal();
    if (!currentMenu) return { warning: false, missingIngredients: [] };

    if (!currentMenu.days[day]) {
      currentMenu.days[day] = [];
    }

    const dish = await this.dishesService.getDishById(dishId);
    let warning = false;
    let missingIngredients: string[] = [];

    if (dish) {
      const missingIds = await this.inventoryService.consumeIngredients(
        dish.ingredients
      );
      if (missingIds.length > 0) {
        warning = true;
        const inventory = await this.inventoryService.getInventory();
        missingIngredients = missingIds.map((id) => {
          const inv = inventory.find((i) => i.id === id);
          return inv ? inv.name : id;
        });
      }
    }

    // Permite agregar el platillo aunque haya advertencia
    if (!currentMenu.days[day].find((d) => d.id === dishId)) {
      if (dish) {
        currentMenu.days[day].push(dish);
        // Guardar advertencia en el menú (opcional, aquí como ejemplo)
        if (!currentMenu["warnings"]) currentMenu["warnings"] = {};
        if (!currentMenu["warnings"][day]) currentMenu["warnings"][day] = {};
        currentMenu["warnings"][day][meal] =
          currentMenu["warnings"][day][meal] || {};
        currentMenu["warnings"][day][meal][dishId] = warning
          ? missingIngredients
          : null;
        this.currentMenuSignal.set({ ...currentMenu });
        await this.saveMenu(currentMenu);
      }
    }

    return { warning, missingIngredients };
  }

  /**
   * Elimina un platillo del menú y devuelve ingredientes al inventario.
   */
  async removeDishFromMenu(
    day: string,
    meal: string,
    dishId: string
  ): Promise<void> {
    const currentMenu = this.currentMenuSignal();
    if (!currentMenu) return;

    const dayArray = currentMenu.days[day];
    const index = dayArray.findIndex(
      (d) => d.id === dishId && d.category === meal
    );

    if (index !== -1) {
      // Devuelve ingredientes al inventario
      const dish = dayArray[index];
      if (dish) {
        await this.inventoryService.addToInventory(dish.ingredients);
      }
      dayArray.splice(index, 1);
      // Elimina advertencia si existe
      if (
        currentMenu["warnings"] &&
        currentMenu["warnings"][day] &&
        currentMenu["warnings"][day][meal]
      ) {
        delete currentMenu["warnings"][day][meal][dishId];
      }
      this.currentMenuSignal.set({ ...currentMenu });
      await this.saveMenu(currentMenu);
    }
  }

  async getMenuForWeek(week: string): Promise<WeeklyMenu | null> {
    const menu = await this.weeklyMenuService.getMenuByWeek(week);
    return menu ?? null;
  }

  async loadWeekMenu(week: string): Promise<void> {
    let menu = await this.weeklyMenuService.getMenuByWeek(week);
    if (!menu) {
      menu = this.initializeEmptyWeek(week);
      await this.saveMenu(menu);
    } else {
      // Cast para poder inicializar warnings sin error de tipo
      const menuTyped = menu as WeeklyMenu & {
        warnings?: {
          [day: string]: {
            [meal: string]: { [dishId: string]: string[] | null };
          };
        };
      };
      for (const day of DAYS_OF_WEEK) {
        if (!menuTyped.days[day]) {
          menuTyped.days[day] = [];
        }
      }
      if (!menuTyped.warnings) {
        menuTyped.warnings = {};
      }
      menu = menuTyped;
    }
    this.currentMenuSignal.set({ ...menu });
    // NO recalcular inventario aquí
  }
}

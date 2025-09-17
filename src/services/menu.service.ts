import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { WeeklyMenu, Dish } from "../models/interfaces";
import { StorageService } from "./storage.service";
import { InventoryService } from "./inventory.service";
import { DishesService } from "./dishes.service";

@Injectable({
  providedIn: "root",
})
export class MenuService {
  private currentMenuSubject = new BehaviorSubject<WeeklyMenu | null>(null);
  public currentMenu$ = this.currentMenuSubject.asObservable();

  constructor(
    private storageService: StorageService,
    private inventoryService: InventoryService,
    private dishesService: DishesService
  ) {
    this.loadCurrentWeekMenu();
  }

  private getCurrentWeek(): string {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    return monday.toISOString().split("T")[0];
  }

  private initializeEmptyWeek(week: string): WeeklyMenu {
    const days = [
      "lunes",
      "martes",
      "miercoles",
      "jueves",
      "viernes",
      "sabado",
      "domingo",
    ];
    const meals: any = {};

    days.forEach((day) => {
      meals[day] = {
        desayuno: [],
        almuerzo: [],
        cafe: [],
        cena: [],
      };
    });

    return {
      id: `menu-${week}`,
      week,
      meals,
    };
  }

  private loadCurrentWeekMenu(): void {
    const currentWeek = this.getCurrentWeek();
    let menu = this.storageService.getItem<WeeklyMenu>(`menu-${currentWeek}`);

    if (!menu) {
      menu = this.initializeEmptyWeek(currentWeek);
      this.saveMenu(menu);
    }

    this.currentMenuSubject.next(menu);
  }

  private saveMenu(menu: WeeklyMenu): void {
    this.storageService.setItem(`menu-${menu.week}`, menu);
  }

  getCurrentMenu(): WeeklyMenu | null {
    return this.currentMenuSubject.value;
  }

  /**
   * Agrega un platillo al menú y consume ingredientes del inventario.
   * Si no hay suficiente stock, marca el platillo como advertencia y permite agregarlo.
   * Devuelve un objeto con el estado de advertencia para la UI.
   */
  addDishToMenu(
    day: string,
    meal: string,
    dishId: string
  ): { warning: boolean; missingIngredients: string[] } {
    const currentMenu = this.currentMenuSubject.value;
    if (!currentMenu) return { warning: false, missingIngredients: [] };

    if (!currentMenu.meals[day]) {
      currentMenu.meals[day] = {
        desayuno: [],
        almuerzo: [],
        cafe: [],
        cena: [],
      };
    }

    const dish = this.dishesService.getDishById(dishId);
    let warning = false;
    let missingIngredients: string[] = [];
    if (dish) {
      // Consume ingredientes y obtiene faltantes
      const missingIds = this.inventoryService.consumeIngredients(
        dish.ingredients
      );
      if (missingIds.length > 0) {
        warning = true;
        // Mapear a nombres legibles
        missingIngredients = missingIds.map((id) => {
          const inv = this.inventoryService
            .getInventory()
            .find((i) => i.id === id);
          return inv ? inv.name : id;
        });
      }
    }

    // Permite agregar el platillo aunque haya advertencia
    if (
      !currentMenu.meals[day][
        meal as keyof (typeof currentMenu.meals)["lunes"]
      ].includes(dishId)
    ) {
      currentMenu.meals[day][
        meal as keyof (typeof currentMenu.meals)["lunes"]
      ].push(dishId);
      // Guardar advertencia en el menú (opcional, aquí como ejemplo)
      if (!currentMenu["warnings"]) currentMenu["warnings"] = {};
      if (!currentMenu["warnings"][day]) currentMenu["warnings"][day] = {};
      currentMenu["warnings"][day][meal] =
        currentMenu["warnings"][day][meal] || {};
      currentMenu["warnings"][day][meal][dishId] = warning
        ? missingIngredients
        : null;
      this.currentMenuSubject.next({ ...currentMenu });
      this.saveMenu(currentMenu);
    }
    return { warning, missingIngredients };
  }

  /**
   * Elimina un platillo del menú y devuelve ingredientes al inventario.
   */
  removeDishFromMenu(day: string, meal: string, dishId: string): void {
    const currentMenu = this.currentMenuSubject.value;
    if (!currentMenu) return;

    const mealArray =
      currentMenu.meals[day][meal as keyof (typeof currentMenu.meals)["lunes"]];
    const index = mealArray.indexOf(dishId);

    if (index !== -1) {
      // Devuelve ingredientes al inventario
      const dish = this.dishesService.getDishById(dishId);
      if (dish) {
        this.inventoryService.addToInventory(dish.ingredients);
      }
      mealArray.splice(index, 1);
      // Elimina advertencia si existe
      if (
        currentMenu["warnings"] &&
        currentMenu["warnings"][day] &&
        currentMenu["warnings"][day][meal]
      ) {
        delete currentMenu["warnings"][day][meal][dishId];
      }
      this.currentMenuSubject.next({ ...currentMenu });
      this.saveMenu(currentMenu);
    }
  }

  getMenuForWeek(week: string): WeeklyMenu | null {
    return this.storageService.getItem<WeeklyMenu>(`menu-${week}`);
  }

  loadWeekMenu(week: string): void {
    let menu = this.getMenuForWeek(week);

    if (!menu) {
      menu = this.initializeEmptyWeek(week);
      this.saveMenu(menu);
    }

    this.currentMenuSubject.next(menu);
  }
}

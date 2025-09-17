import { Injectable, inject, signal } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { WeeklyMenu, Dish } from "../models/interfaces";
import { DatabaseService } from "./database.service";
import { InventoryService } from "./inventory.service";
import { DishesService } from "./dishes.service";

@Injectable({
  providedIn: "root",
})
export class MenuService {
  private db = inject(DatabaseService);
  private inventoryService = inject(InventoryService);
  private dishesService = inject(DishesService);

  private currentMenuSubject = new BehaviorSubject<WeeklyMenu | null>(null);
  public currentMenu$ = this.currentMenuSubject.asObservable();
  
  // Signal for reactive updates
  public currentMenuSignal = signal<WeeklyMenu | null>(null);

  constructor() {
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

  private async loadCurrentWeekMenu(): Promise<void> {
    try {
      const currentWeek = this.getCurrentWeek();
      let menu = await this.db.weeklyMenus.where('week').equals(currentWeek).first();

      if (!menu) {
        menu = this.initializeEmptyWeek(currentWeek);
        await this.saveMenu(menu);
      }

      this.currentMenuSubject.next(menu);
      this.currentMenuSignal.set(menu);
    } catch (error) {
      console.error('Error loading current week menu:', error);
    }
  }

  private async saveMenu(menu: WeeklyMenu): Promise<void> {
    try {
      await this.db.weeklyMenus.put(menu);
    } catch (error) {
      console.error('Error saving menu:', error);
    }
  }

  getCurrentMenu(): WeeklyMenu | null {
    return this.currentMenuSubject.value;
  }

  async addDishToMenu(
    day: string,
    meal: string,
    dishId: string
  ): Promise<{ warning: boolean; missingIngredients: string[] }> {
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

    const dish = await this.dishesService.getDishById(dishId);
    let warning = false;
    let missingIngredients: string[] = [];
    
    if (dish) {
      const missingIds = await this.inventoryService.consumeIngredients(dish.ingredients);
      if (missingIds.length > 0) {
        warning = true;
        const inventory = await this.inventoryService.getInventory();
        missingIngredients = missingIds.map((id) => {
          const inv = inventory.find((i) => i.id === id);
          return inv ? inv.name : id;
        });
      }
    }

    const mealArray = currentMenu.meals[day][meal as keyof (typeof currentMenu.meals)["lunes"]];
    if (!mealArray.includes(dishId)) {
      mealArray.push(dishId);
      
      if (!currentMenu["warnings"]) currentMenu["warnings"] = {};
      if (!currentMenu["warnings"][day]) currentMenu["warnings"][day] = {};
      currentMenu["warnings"][day][meal] = currentMenu["warnings"][day][meal] || {};
      currentMenu["warnings"][day][meal][dishId] = warning ? missingIngredients : null;
      
      this.currentMenuSubject.next({ ...currentMenu });
      this.currentMenuSignal.set({ ...currentMenu });
      await this.saveMenu(currentMenu);
    }
    
    return { warning, missingIngredients };
  }

  async removeDishFromMenu(day: string, meal: string, dishId: string): Promise<void> {
    const currentMenu = this.currentMenuSubject.value;
    if (!currentMenu) return;

    const mealArray = currentMenu.meals[day][meal as keyof (typeof currentMenu.meals)["lunes"]];
    const index = mealArray.indexOf(dishId);

    if (index !== -1) {
      const dish = await this.dishesService.getDishById(dishId);
      if (dish) {
        await this.inventoryService.addToInventory(dish.ingredients);
      }
      
      mealArray.splice(index, 1);
      
      if (
        currentMenu["warnings"] &&
        currentMenu["warnings"][day] &&
        currentMenu["warnings"][day][meal]
      ) {
        delete currentMenu["warnings"][day][meal][dishId];
      }
      
      this.currentMenuSubject.next({ ...currentMenu });
      this.currentMenuSignal.set({ ...currentMenu });
      await this.saveMenu(currentMenu);
    }
  }

  async getMenuForWeek(week: string): Promise<WeeklyMenu | null> {
    try {
      return await this.db.weeklyMenus.where('week').equals(week).first() || null;
    } catch (error) {
      console.error('Error getting menu for week:', error);
      return null;
    }
  }

  async loadWeekMenu(week: string): Promise<void> {
    try {
      let menu = await this.getMenuForWeek(week);

      if (!menu) {
        menu = this.initializeEmptyWeek(week);
        await this.saveMenu(menu);
      }

      this.currentMenuSubject.next(menu);
      this.currentMenuSignal.set(menu);
    } catch (error) {
      console.error('Error loading week menu:', error);
    }
  }

  async replaceCurrentWeekMenu(menuData: { [day: string]: Dish[] }): Promise<void> {
    const currentWeek = this.getCurrentWeek();
    let menu = await this.getMenuForWeek(currentWeek);
    
    if (!menu) {
      menu = this.initializeEmptyWeek(currentWeek);
    }

    // Clear current menu
    Object.keys(menu.meals).forEach(day => {
      menu!.meals[day] = {
        desayuno: [],
        almuerzo: [],
        cafe: [],
        cena: [],
      };
    });

    // Add dishes from predefined menu
    Object.keys(menuData).forEach(day => {
      if (menu!.meals[day]) {
        menuData[day].forEach(dish => {
          const mealType = dish.category as keyof typeof menu!.meals[typeof day];
          if (menu!.meals[day][mealType]) {
            menu!.meals[day][mealType].push(dish.id);
          }
        });
      }
    });

    // Clear warnings
    menu.warnings = {};

    await this.saveMenu(menu);
    this.currentMenuSubject.next({ ...menu });
    this.currentMenuSignal.set({ ...menu });
  }
}
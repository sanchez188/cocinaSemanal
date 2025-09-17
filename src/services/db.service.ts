import Dexie, { Table } from "dexie";
import { Injectable } from "@angular/core";
import { Dish, ShoppingList, Purchase } from "../models/interfaces";
// ...existing code...

export interface WeeklyMenu {
  id: string;
  week: string;
  days: { [day: string]: Dish[] };
}

export interface PredefinedMenuWeek {
  id: string;
  name: string;
  days: { [day: string]: Dish[] };
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
}

@Injectable({ providedIn: "root" })
export class CocinaSemanalDB extends Dexie {
  dishes!: Table<Dish, string>;
  weeklyMenus!: Table<WeeklyMenu, string>;
  predefinedMenus!: Table<PredefinedMenuWeek, string>;
  inventory!: Table<InventoryItem, string>;
  shoppingLists!: Table<ShoppingList, string>;
  purchases!: Table<Purchase, string>;

  constructor() {
    super("cocinaSemanal");
    this.version(1).stores({
      weeklyMenus: "id",
      predefinedMenus: "id",
      inventory: "id",
      shoppingLists: "id",
      purchases: "id",
      dishes: "id",
    });
  }
}

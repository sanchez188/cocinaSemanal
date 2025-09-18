import { signal, WritableSignal } from "@angular/core";
import { v4 as uuidv4 } from "uuid";
import { CocinaSemanalDB } from "./db.service";
import { Injectable } from "@angular/core";
import { Dish } from "../models/interfaces";

@Injectable({
  providedIn: "root",
})
export class DishesService {
  private dishesSignal: WritableSignal<Dish[]> = signal([]);
  public dishes = this.dishesSignal;

  constructor(private db: CocinaSemanalDB) {
    this.init();
  }

  private async init(): Promise<void> {
    await this.loadDishes();
  }

  private async loadDishes(): Promise<void> {
    const dishes = await this.db.dishes.toArray();
    if (dishes.length === 0) {
      console.warn("[DishesService] No hay platillos en la base Dexie.");
    } else {
      console.info("[DishesService] Platillos cargados:", dishes);
    }
    this.dishesSignal.set(dishes);
  }

  getDishes(): Dish[] {
    return this.dishesSignal();
  }

  async getDishById(id: string): Promise<Dish | undefined> {
    return await this.db.dishes.get(id);
  }

  async addDish(dish: Dish): Promise<void> {
    // Asegura que el platillo tenga un id único
    if (!dish.id || typeof dish.id !== "string" || dish.id.trim() === "") {
      dish.id = uuidv4();
    }
    try {
      await this.db.dishes.put(dish);
      console.info("[DishesService] Platillo guardado:", dish);
    } catch (err) {
      console.error("[DishesService] Error al guardar platillo:", err, dish);
    }
    await this.loadDishes();
  }

  async updateDish(dish: Dish): Promise<void> {
    await this.db.dishes.put(dish);
    await this.loadDishes();
  }

  async removeDish(id: string): Promise<void> {
    await this.db.dishes.delete(id);
    await this.loadDishes();
  }

  async getDishesByCategory(category: string): Promise<Dish[]> {
    const dishes = await this.db.dishes
      .where("category")
      .equals(category)
      .toArray();
    return dishes;
  }
}

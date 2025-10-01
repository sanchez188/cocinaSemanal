import { signal, WritableSignal } from "@angular/core";
import { v4 as uuidv4 } from "uuid";
import { Injectable } from "@angular/core";
import { Dish } from "../models/interfaces";
import { SupabaseService } from "./supabase.service";
import { NotificationService } from "./notification.service";

@Injectable({
  providedIn: "root",
})
export class DishesService {
  private dishesSignal: WritableSignal<Dish[]> = signal([]);
  public dishes = this.dishesSignal;

  constructor(
    private supabaseService: SupabaseService,
    private notificationService: NotificationService
  ) {
    this.loadDishes();
  }

  /**
   * Carga los platos desde Supabase
   */
  private async loadDishes(): Promise<void> {
    try {
      const dishes = await this.supabaseService.getDishes();
      this.dishesSignal.set(dishes);
      console.info(
        "[DishesService] Platos cargados desde Supabase:",
        dishes.length
      );
    } catch (error) {
      console.error(
        "[DishesService] Error cargando platos desde Supabase:",
        error
      );
      this.dishesSignal.set([]);
    }
  }

  /**
   * Obtiene todos los platos
   */
  getDishes(): Dish[] {
    return this.dishesSignal();
  }

  /**
   * Obtiene un plato por ID
   */
  async getDishById(id: string): Promise<Dish | undefined> {
    const dishes = this.dishesSignal();
    return dishes.find((dish) => dish.id === id);
  }

  /**
   * Agrega un nuevo plato
   */
  async addDish(dish: Dish): Promise<boolean> {
    // Asegura que el plato tenga un id único
    if (!dish.id || typeof dish.id !== "string" || dish.id.trim() === "") {
      dish.id = uuidv4();
    }

    try {
      const success = await this.supabaseService.addDish(dish);
      if (success) {
        await this.loadDishes(); // Recargar desde Supabase
        this.notificationService.showSuccess(
          `🍽️ Plato "${dish.name}" agregado correctamente`
        );
        console.info("[DishesService] Plato guardado en Supabase:", dish);
        return true;
      } else {
        this.notificationService.showError(
          `❌ Error al agregar el plato "${dish.name}"`
        );
        return false;
      }
    } catch (error) {
      console.error("[DishesService] Error al guardar plato:", error, dish);
      this.notificationService.showError(
        `❌ Error al agregar el plato: ${error}`
      );
      return false;
    }
  }

  /**
   * Actualiza un plato existente
   */
  async updateDish(dish: Dish): Promise<boolean> {
    try {
      const success = await this.supabaseService.updateDish(dish);
      if (success) {
        await this.loadDishes(); // Recargar desde Supabase
        this.notificationService.showSuccess(
          `🍽️ Plato "${dish.name}" actualizado correctamente`
        );
        return true;
      } else {
        this.notificationService.showError(
          `❌ Error al actualizar el plato "${dish.name}"`
        );
        return false;
      }
    } catch (error) {
      console.error("[DishesService] Error al actualizar plato:", error);
      this.notificationService.showError(
        `❌ Error al actualizar el plato: ${error}`
      );
      return false;
    }
  }

  /**
   * Elimina un plato
   */
  async removeDish(id: string): Promise<boolean> {
    try {
      // Obtener el nombre antes de eliminar para el mensaje
      const dish = this.dishesSignal().find((d) => d.id === id);
      const dishName = dish?.name || "Plato";

      const success = await this.supabaseService.deleteDish(id);
      if (success) {
        await this.loadDishes(); // Recargar desde Supabase
        this.notificationService.showSuccess(
          `🗑️ Plato "${dishName}" eliminado correctamente`
        );
        return true;
      } else {
        this.notificationService.showError(
          `❌ Error al eliminar el plato "${dishName}"`
        );
        return false;
      }
    } catch (error) {
      console.error("[DishesService] Error al eliminar plato:", error);
      this.notificationService.showError(
        `❌ Error al eliminar el plato: ${error}`
      );
      return false;
    }
  }

  /**
   * Obtiene platos por categoría
   */
  async getDishesByCategory(category: string): Promise<Dish[]> {
    const dishes = this.dishesSignal();
    return dishes.filter((dish) => dish.category === category);
  }
}

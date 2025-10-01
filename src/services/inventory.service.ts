import { Injectable } from "@angular/core";
import { signal, WritableSignal } from "@angular/core";
import { Ingredient } from "../models/interfaces";
import { SupabaseService } from "./supabase.service";
import { NotificationService } from "./notification.service";

@Injectable({
  providedIn: "root",
})
export class InventoryService {
  private inventorySignal: WritableSignal<Ingredient[]> = signal([]);
  public inventory = this.inventorySignal;

  constructor(
    private supabaseService: SupabaseService,
    private notificationService: NotificationService
  ) {
    this.loadInventory();
  }

  /**
   * Carga el inventario desde Supabase
   */
  private async loadInventory(): Promise<void> {
    try {
      const ingredients = await this.supabaseService.getIngredients();
      this.inventorySignal.set(ingredients);
    } catch (error) {
      console.error("Error loading inventory from Supabase:", error);
      this.inventorySignal.set([]);
    }
  }

  /**
   * Obtiene el inventario actual
   */
  getInventory(): Ingredient[] {
    return this.inventorySignal();
  }

  /**
   * Agrega un nuevo ingrediente
   */
  async addIngredient(ingredient: Ingredient): Promise<boolean> {
    try {
      const success = await this.supabaseService.addIngredient(ingredient);
      if (success) {
        await this.loadInventory(); // Recargar desde Supabase
        this.notificationService.showSuccess(
          `✅ Ingrediente "${ingredient.name}" agregado correctamente`
        );
        return true;
      } else {
        this.notificationService.showError(
          `❌ Error al agregar el ingrediente "${ingredient.name}"`
        );
        return false;
      }
    } catch (error) {
      console.error("Error adding ingredient:", error);
      this.notificationService.showError(
        `❌ Error al agregar el ingrediente: ${error}`
      );
      return false;
    }
  }

  /**
   * Actualiza un ingrediente existente
   */
  async updateIngredient(ingredient: Ingredient): Promise<boolean> {
    try {
      const success = await this.supabaseService.updateIngredient(ingredient);
      if (success) {
        await this.loadInventory(); // Recargar desde Supabase
        this.notificationService.showSuccess(
          `✅ Ingrediente "${ingredient.name}" actualizado correctamente`
        );
        return true;
      } else {
        this.notificationService.showError(
          `❌ Error al actualizar el ingrediente "${ingredient.name}"`
        );
        return false;
      }
    } catch (error) {
      console.error("Error updating ingredient:", error);
      this.notificationService.showError(
        `❌ Error al actualizar el ingrediente: ${error}`
      );
      return false;
    }
  }

  /**
   * Elimina un ingrediente
   */
  async removeIngredient(id: string): Promise<boolean> {
    try {
      // Obtener el nombre antes de eliminar para el mensaje
      const ingredient = this.inventorySignal().find((ing) => ing.id === id);
      const ingredientName = ingredient?.name || "Ingrediente";

      const success = await this.supabaseService.deleteIngredient(id);
      if (success) {
        await this.loadInventory(); // Recargar desde Supabase
        this.notificationService.showSuccess(
          `✅ "${ingredientName}" eliminado correctamente`
        );
        return true;
      } else {
        this.notificationService.showError(
          `❌ Error al eliminar "${ingredientName}"`
        );
        return false;
      }
    } catch (error) {
      console.error("Error removing ingredient:", error);
      this.notificationService.showError(
        `❌ Error al eliminar el ingrediente: ${error}`
      );
      return false;
    }
  }

  /**
   * Agrega múltiples ingredientes al inventario
   */
  async batchAddIngredients(
    items: Array<{
      name: string;
      unit: string;
      isPackage?: boolean;
      quantity: number;
      pricePerUnit?: number;
      priceTotal?: number;
      category?: string;
    }>
  ): Promise<boolean> {
    try {
      const ingredients: Ingredient[] = items.map((item) => ({
        id:
          item.name.toLowerCase().replace(/\s+/g, "-") +
          "-" +
          Math.floor(Math.random() * 10000),
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        pricePerUnit: item.isPackage ? 0 : item.pricePerUnit || 0,
        priceTotal: item.isPackage ? item.priceTotal || 0 : undefined,
        isPackage: !!item.isPackage,
        category: item.category || "otros",
      }));

      let allSuccess = true;
      for (const ingredient of ingredients) {
        const success = await this.supabaseService.addIngredient(ingredient);
        if (!success) allSuccess = false;
      }

      if (allSuccess) {
        await this.loadInventory();
      }
      return allSuccess;
    } catch (error) {
      console.error("Error batch adding ingredients:", error);
      return false;
    }
  }

  /**
   * Suma todos los ingredientes usados en un menú y los devuelve al inventario.
   */
  async batchAddIngredientsFromMenu(menu: {
    days: { [day: string]: any[] };
  }): Promise<void> {
    const toAdd: {
      [id: string]: {
        quantity: number;
        name?: string;
        unit?: string;
        pricePerUnit?: number;
      };
    } = {};

    for (const day of Object.keys(menu.days)) {
      for (const dish of menu.days[day]) {
        if (dish.ingredients) {
          for (const ing of dish.ingredients) {
            if (!toAdd[ing.ingredientId]) {
              toAdd[ing.ingredientId] = {
                quantity: 0,
                name: ing.name,
                unit: ing.unit,
                pricePerUnit: ing.pricePerUnit,
              };
            }
            toAdd[ing.ingredientId].quantity += ing.quantity;
          }
        }
      }
    }

    const addArray = Object.entries(toAdd).map(([ingredientId, data]) => ({
      ingredientId,
      name: data.name,
      quantity: data.quantity,
      unit: data.unit,
      pricePerUnit: data.pricePerUnit,
    }));

    await this.addToInventory(addArray);
  }

  /**
   * Recalcula el inventario descontando los ingredientes usados en el menú semanal.
   */
  async recalculateInventoryFromMenu(menu: {
    days: { [day: string]: any[] };
  }): Promise<void> {
    const currentInventory = [...this.inventorySignal()];
    const used: { [id: string]: number } = {};

    // Sumar ingredientes usados en el menú
    for (const day of Object.keys(menu.days)) {
      for (const dish of menu.days[day]) {
        if (dish.ingredients) {
          for (const ing of dish.ingredients) {
            used[ing.ingredientId] =
              (used[ing.ingredientId] || 0) + ing.quantity;
          }
        }
      }
    }

    // Descontar del inventario y actualizar en Supabase
    for (const item of currentInventory) {
      if (used[item.id]) {
        item.quantity = Math.max(0, item.quantity - used[item.id]);
        await this.supabaseService.updateIngredient(item);
      }
    }

    await this.loadInventory();
  }

  /**
   * Consume ingredientes que tengan suficiente stock y devuelve los faltantes.
   */
  async consumeIngredients(
    ingredients: { ingredientId: string; quantity: number }[]
  ): Promise<string[]> {
    const currentInventory = [...this.inventorySignal()];
    const missing: string[] = [];
    const toUpdate: Ingredient[] = [];

    for (const ingredient of ingredients) {
      const inventoryItem = currentInventory.find(
        (item) => item.id === ingredient.ingredientId
      );
      if (!inventoryItem || inventoryItem.quantity < ingredient.quantity) {
        missing.push(ingredient.ingredientId);
      } else {
        inventoryItem.quantity -= ingredient.quantity;
        toUpdate.push(inventoryItem);
      }
    }

    // Actualizar ingredientes en Supabase
    for (const item of toUpdate) {
      await this.supabaseService.updateIngredient(item);
    }

    await this.loadInventory();
    return missing;
  }

  /**
   * Agrega cantidad a ingredientes existentes
   */
  async addToInventory(
    ingredients: {
      ingredientId: string;
      name?: string;
      quantity: number;
      unit?: string;
      pricePerUnit?: number;
    }[]
  ): Promise<void> {
    const currentInventory = [...this.inventorySignal()];

    for (const ingredient of ingredients) {
      let inventoryItem = currentInventory.find(
        (item) => item.id === ingredient.ingredientId
      );

      if (inventoryItem) {
        // Actualizar cantidad existente
        inventoryItem.quantity += ingredient.quantity;
        await this.supabaseService.updateIngredient(inventoryItem);
      } else {
        // Crear nuevo ingrediente
        const newIngredient: Ingredient = {
          id: ingredient.ingredientId,
          name: ingredient.name || "Nuevo producto",
          quantity: ingredient.quantity,
          unit: ingredient.unit || "unidades",
          pricePerUnit: ingredient.pricePerUnit || 0,
          category: "otros",
        };
        await this.supabaseService.addIngredient(newIngredient);
      }
    }

    await this.loadInventory();
  }
}

import { Injectable } from "@angular/core";
import { ShoppingList, Purchase } from "../models/interfaces";
import { SupabaseService } from "./supabase.service";

@Injectable({ providedIn: "root" })
export class ShoppingListService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Obtiene una lista de compras por ID
   */
  async getShoppingList(id: string): Promise<ShoppingList | null> {
    const lists = await this.supabaseService.getShoppingLists();
    return lists.find((list) => list.id === id) || null;
  }

  /**
   * Obtiene una lista de compras por semana
   */
  async getShoppingListByWeek(weekId: string): Promise<ShoppingList | null> {
    return await this.supabaseService.getShoppingListByWeek(weekId);
  }

  /**
   * Guarda una lista de compras
   */
  async saveShoppingList(list: ShoppingList): Promise<boolean> {
    return await this.supabaseService.saveShoppingList(list);
  }

  /**
   * Obtiene todas las listas de compras
   */
  async getAllShoppingLists(): Promise<ShoppingList[]> {
    return await this.supabaseService.getShoppingLists();
  }

  /**
   * Elimina una lista de compras (implementación futura si es necesaria)
   */
  async deleteShoppingList(id: string): Promise<boolean> {
    // TODO: Implementar eliminación en SupabaseService si es necesario
    console.warn(
      "Delete shopping list not implemented yet in Supabase service"
    );
    return false;
  }

  /**
   * Obtiene todas las compras
   */
  async getPurchases(): Promise<Purchase[]> {
    return await this.supabaseService.getPurchases();
  }

  /**
   * Guarda una compra
   */
  async savePurchase(purchase: Purchase): Promise<boolean> {
    return await this.supabaseService.savePurchase(purchase);
  }

  /**
   * Elimina una compra (implementación futura si es necesaria)
   */
  async deletePurchase(id: string): Promise<boolean> {
    // TODO: Implementar eliminación en SupabaseService si es necesario
    console.warn("Delete purchase not implemented yet in Supabase service");
    return false;
  }
}

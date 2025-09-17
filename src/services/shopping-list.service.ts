import { Injectable } from "@angular/core";
import { CocinaSemanalDB } from "./db.service";
import { ShoppingList, Purchase } from "../models/interfaces";

@Injectable({ providedIn: "root" })
export class ShoppingListService {
  constructor(private db: CocinaSemanalDB) {}

  async getShoppingList(id: string): Promise<ShoppingList | undefined> {
    return this.db.shoppingLists.get(id);
  }

  async saveShoppingList(list: ShoppingList): Promise<void> {
    await this.db.shoppingLists.put(list);
  }

  async getAllShoppingLists(): Promise<ShoppingList[]> {
    return this.db.shoppingLists.toArray();
  }

  async deleteShoppingList(id: string): Promise<void> {
    await this.db.shoppingLists.delete(id);
  }

  async getPurchases(): Promise<Purchase[]> {
    return this.db.purchases.toArray();
  }

  async savePurchase(purchase: Purchase): Promise<void> {
    await this.db.purchases.put(purchase);
  }

  async deletePurchase(id: string): Promise<void> {
    await this.db.purchases.delete(id);
  }
}

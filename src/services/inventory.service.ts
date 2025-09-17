import { Injectable, inject } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { Ingredient } from "../models/interfaces";
import { DatabaseService } from "./database.service";

@Injectable({
  providedIn: "root",
})
export class InventoryService {
  private db = inject(DatabaseService);
  private inventorySubject = new BehaviorSubject<Ingredient[]>([]);
  public inventory$ = this.inventorySubject.asObservable();

  constructor() {
    this.loadInventory();
  }

  private async loadInventory(): Promise<void> {
    try {
      const inventory = await this.db.ingredients.toArray();
      this.inventorySubject.next(inventory);
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  }

  async getInventory(): Promise<Ingredient[]> {
    return await this.db.ingredients.toArray();
  }

  async addIngredient(ingredient: Ingredient): Promise<void> {
    try {
      await this.db.ingredients.put(ingredient);
      await this.loadInventory();
    } catch (error) {
      console.error('Error adding ingredient:', error);
    }
  }

  async updateIngredient(ingredient: Ingredient): Promise<void> {
    try {
      await this.db.ingredients.put(ingredient);
      await this.loadInventory();
    } catch (error) {
      console.error('Error updating ingredient:', error);
    }
  }

  async removeIngredient(id: string): Promise<void> {
    try {
      await this.db.ingredients.delete(id);
      await this.loadInventory();
    } catch (error) {
      console.error('Error removing ingredient:', error);
    }
  }

  async consumeIngredients(
    ingredients: { ingredientId: string; quantity: number }[]
  ): Promise<string[]> {
    const missing: string[] = [];
    
    try {
      await this.db.transaction('rw', this.db.ingredients, async () => {
        for (const ingredient of ingredients) {
          const inventoryItem = await this.db.ingredients.get(ingredient.ingredientId);
          
          if (!inventoryItem || inventoryItem.quantity < ingredient.quantity) {
            missing.push(ingredient.ingredientId);
          } else {
            inventoryItem.quantity -= ingredient.quantity;
            await this.db.ingredients.put(inventoryItem);
          }
        }
      });
      
      await this.loadInventory();
    } catch (error) {
      console.error('Error consuming ingredients:', error);
    }
    
    return missing;
  }

  async addToInventory(
    ingredients: {
      ingredientId: string;
      name?: string;
      quantity: number;
      unit?: string;
      pricePerUnit?: number;
    }[]
  ): Promise<void> {
    try {
      await this.db.transaction('rw', this.db.ingredients, async () => {
        for (const ingredient of ingredients) {
          let inventoryItem = await this.db.ingredients.get(ingredient.ingredientId);
          
          if (inventoryItem) {
            inventoryItem.quantity += ingredient.quantity;
            await this.db.ingredients.put(inventoryItem);
          } else {
            const newItem: Ingredient = {
              id: ingredient.ingredientId,
              name: ingredient.name || "Nuevo producto",
              quantity: ingredient.quantity,
              unit: ingredient.unit || "unidades",
              pricePerUnit: ingredient.pricePerUnit || 0,
              category: "otros",
            };
            await this.db.ingredients.add(newItem);
          }
        }
      });
      
      await this.loadInventory();
    } catch (error) {
      console.error('Error adding to inventory:', error);
    }
  }

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
  ): Promise<void> {
    try {
      const ingredients: Ingredient[] = items.map(item => ({
        id: item.name.toLowerCase().replace(/\s+/g, "-") + "-" + Math.floor(Math.random() * 10000),
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        pricePerUnit: item.isPackage ? 0 : item.pricePerUnit || 0,
        priceTotal: item.isPackage ? item.priceTotal || 0 : undefined,
        isPackage: !!item.isPackage,
        category: item.category || "otros",
      }));

      await this.db.ingredients.bulkAdd(ingredients);
      await this.loadInventory();
    } catch (error) {
      console.error('Error batch adding ingredients:', error);
    }
  }
}
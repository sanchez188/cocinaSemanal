import { Injectable, inject } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import {
  ShoppingList,
  Purchase,
  WeeklyData,
  ShoppingItem,
} from "../models/interfaces";
import { DatabaseService } from "./database.service";
import { MenuService } from "./menu.service";
import { DishesService } from "./dishes.service";
import { InventoryService } from "./inventory.service";

@Injectable({
  providedIn: "root",
})
export class ShoppingService {
  private db = inject(DatabaseService);
  private menuService = inject(MenuService);
  private dishesService = inject(DishesService);
  private inventoryService = inject(InventoryService);

  private shoppingListSubject = new BehaviorSubject<ShoppingList | null>(null);
  public shoppingList$ = this.shoppingListSubject.asObservable();

  private purchasesSubject = new BehaviorSubject<Purchase[]>([]);
  public purchases$ = this.purchasesSubject.asObservable();

  constructor() {
    this.loadPurchases();
  }

  private async loadPurchases(): Promise<void> {
    try {
      const purchases = await this.db.purchases.toArray();
      this.purchasesSubject.next(purchases);
    } catch (error) {
      console.error('Error loading purchases:', error);
    }
  }

  private async savePurchases(): Promise<void> {
    // Purchases are automatically saved to IndexedDB, no need for manual save
  }

  async removeItem(index: number): Promise<void> {
    const currentList = this.shoppingListSubject.value;
    if (!currentList) return;
    
    currentList.items.splice(index, 1);
    currentList.totalCost = currentList.items.reduce(
      (total, i) => total + i.quantity * i.pricePerUnit,
      0
    );
    currentList.completed = currentList.items.every((i) => i.purchased);
    
    this.shoppingListSubject.next({ ...currentList });
    await this.db.shoppingLists.put(currentList);
  }

  async addManualItem(item: ShoppingItem): Promise<void> {
    const currentList = this.shoppingListSubject.value;
    if (!currentList) return;
    
    currentList.items.push(item);
    currentList.totalCost = currentList.items.reduce(
      (total, i) => total + i.quantity * i.pricePerUnit,
      0
    );
    currentList.completed = currentList.items.every((i) => i.purchased);
    
    this.shoppingListSubject.next({ ...currentList });
    await this.db.shoppingLists.put(currentList);
  }

  async generateShoppingList(): Promise<ShoppingList | null> {
    const currentMenu = this.menuService.getCurrentMenu();
    const inventory = await this.inventoryService.getInventory();

    if (!currentMenu) return null;

    const requiredIngredients = new Map<string, number>();

    // Calculate required ingredients for all dishes in the menu
    for (const day of Object.keys(currentMenu.meals)) {
      const dayMeals = currentMenu.meals[day];
      for (const mealType of Object.keys(dayMeals)) {
        const dishIds = dayMeals[mealType as keyof typeof dayMeals];
        for (const dishId of dishIds) {
          const dish = await this.dishesService.getDishById(dishId);
          if (dish) {
            dish.ingredients.forEach((ingredient) => {
              const currentRequired = requiredIngredients.get(ingredient.ingredientId) || 0;
              requiredIngredients.set(ingredient.ingredientId, currentRequired + ingredient.quantity);
            });
          }
        }
      }
    }

    // Check what we need to buy (subtract current inventory)
    const shoppingItems: ShoppingItem[] = [];
    for (const [ingredientId, required] of requiredIngredients) {
      const inventoryItem = inventory.find((item) => item.id === ingredientId);
      const available = inventoryItem ? inventoryItem.quantity : 0;
      const needed = Math.max(0, required - available);

      if (needed > 0) {
        shoppingItems.push({
          ingredientId,
          name: inventoryItem?.name || "Unknown ingredient",
          quantity: needed,
          unit: inventoryItem?.unit || "unit",
          pricePerUnit: inventoryItem?.pricePerUnit || 0,
          purchased: false,
        });
      }
    }

    const shoppingList: ShoppingList = {
      id: `shopping-${currentMenu.week}`,
      weekId: currentMenu.week,
      items: shoppingItems,
      totalCost: shoppingItems.reduce(
        (total, item) => total + item.quantity * item.pricePerUnit,
        0
      ),
      completed: false,
      createdAt: new Date(),
    };

    this.shoppingListSubject.next(shoppingList);
    await this.db.shoppingLists.put(shoppingList);

    return shoppingList;
  }

  async toggleItemPurchased(itemIndex: number): Promise<void> {
    const currentList = this.shoppingListSubject.value;
    if (!currentList) return;

    currentList.items[itemIndex].purchased = !currentList.items[itemIndex].purchased;
    currentList.completed = currentList.items.every((item) => item.purchased);

    this.shoppingListSubject.next({ ...currentList });
    await this.db.shoppingLists.put(currentList);
  }

  async completePurchase(): Promise<Purchase | null> {
    const shoppingList = this.shoppingListSubject.value;
    if (!shoppingList || !shoppingList.completed) return null;

    const purchasedItems = shoppingList.items
      .filter((item) => item.purchased)
      .map((item) => ({
        ingredientId: item.ingredientId,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        pricePerUnit: item.pricePerUnit,
        totalPrice: item.quantity * item.pricePerUnit,
      }));

    const purchase: Purchase = {
      id: `purchase-${Date.now()}`,
      weekId: shoppingList.weekId,
      items: purchasedItems,
      totalCost: purchasedItems.reduce((total, item) => total + item.totalPrice, 0),
      date: new Date(),
    };

    // Add purchased items to inventory
    const inventoryItems = purchasedItems.map((item) => ({
      ingredientId: item.ingredientId,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      pricePerUnit: item.pricePerUnit,
    }));

    await this.inventoryService.addToInventory(inventoryItems);

    // Save purchase
    await this.db.purchases.add(purchase);
    await this.loadPurchases();

    // Clear shopping list
    this.shoppingListSubject.next(null);
    await this.db.shoppingLists.delete(shoppingList.id);

    return purchase;
  }

  async getPurchases(): Promise<Purchase[]> {
    return await this.db.purchases.toArray();
  }

  async exportWeeklyData(week: string): Promise<WeeklyData | null> {
    return await this.db.exportWeeklyData(week);
  }

  async importWeeklyData(data: WeeklyData): Promise<boolean> {
    const success = await this.db.importWeeklyData(data);
    if (success) {
      await this.loadPurchases();
      await this.menuService.loadWeekMenu(data.week);
    }
    return success;
  }
}
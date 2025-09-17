import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import {
  ShoppingList,
  Purchase,
  WeeklyData,
  ShoppingItem,
} from "../models/interfaces";
import { StorageService } from "./storage.service";
import { MenuService } from "./menu.service";
import { DishesService } from "./dishes.service";
import { InventoryService } from "./inventory.service";

@Injectable({
  providedIn: "root",
})
export class ShoppingService {
  private shoppingListSubject = new BehaviorSubject<ShoppingList | null>(null);
  public shoppingList$ = this.shoppingListSubject.asObservable();

  private purchasesSubject = new BehaviorSubject<Purchase[]>([]);
  public purchases$ = this.purchasesSubject.asObservable();

  constructor(
    private storageService: StorageService,
    private menuService: MenuService,
    private dishesService: DishesService,
    private inventoryService: InventoryService
  ) {
    this.loadPurchases();
  }

  public removeItem(index: number): void {
    const currentList = this.shoppingListSubject.value;
    if (!currentList) return;
    currentList.items.splice(index, 1);
    currentList.totalCost = currentList.items.reduce(
      (total, i) => total + i.quantity * i.pricePerUnit,
      0
    );
    currentList.completed = currentList.items.every((i) => i.purchased);
    this.shoppingListSubject.next({ ...currentList });
    this.storageService.setItem(`shopping-${currentList.weekId}`, currentList);
  }

  private loadPurchases(): void {
    const purchases =
      this.storageService.getItem<Purchase[]>("purchases") || [];
    this.purchasesSubject.next(purchases);
  }
  // Permite agregar un ingrediente manualmente a la lista de compras
  private savePurchases(): void {
    this.storageService.setItem("purchases", this.purchasesSubject.value);
  }

  addManualItem(item: ShoppingItem): void {
    const currentList = this.shoppingListSubject.value;
    if (!currentList) return;
    currentList.items.push(item);
    currentList.totalCost = currentList.items.reduce(
      (total, i) => total + i.quantity * i.pricePerUnit,
      0
    );
    currentList.completed = currentList.items.every((i) => i.purchased);
    this.shoppingListSubject.next({ ...currentList });
    this.storageService.setItem(`shopping-${currentList.weekId}`, currentList);
  }

  generateShoppingList(): ShoppingList | null {
    const currentMenu = this.menuService.getCurrentMenu();
    const inventory = this.inventoryService.getInventory();

    if (!currentMenu) return null;

    const requiredIngredients = new Map<string, number>();

    // Calculate required ingredients for all dishes in the menu
    Object.keys(currentMenu.meals).forEach((day) => {
      const dayMeals = currentMenu.meals[day];
      Object.keys(dayMeals).forEach((mealType) => {
        const dishIds = dayMeals[mealType as keyof typeof dayMeals];
        dishIds.forEach((dishId) => {
          const dish = this.dishesService.getDishById(dishId);
          if (dish) {
            dish.ingredients.forEach((ingredient) => {
              const currentRequired =
                requiredIngredients.get(ingredient.ingredientId) || 0;
              requiredIngredients.set(
                ingredient.ingredientId,
                currentRequired + ingredient.quantity
              );
            });
          }
        });
      });
    });

    // Check what we need to buy (subtract current inventory)
    const shoppingItems: any[] = [];
    requiredIngredients.forEach((required, ingredientId) => {
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
    });

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
    this.storageService.setItem(`shopping-${currentMenu.week}`, shoppingList);

    return shoppingList;
  }

  toggleItemPurchased(itemIndex: number): void {
    const currentList = this.shoppingListSubject.value;
    if (!currentList) return;

    currentList.items[itemIndex].purchased =
      !currentList.items[itemIndex].purchased;
    currentList.completed = currentList.items.every((item) => item.purchased);

    this.shoppingListSubject.next({ ...currentList });
    this.storageService.setItem(`shopping-${currentList.weekId}`, currentList);
  }

  completePurchase(): Purchase | null {
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
      totalCost: purchasedItems.reduce(
        (total, item) => total + item.totalPrice,
        0
      ),
      date: new Date(),
    };

    // Add purchased items to inventory
    const inventoryItems = purchasedItems.map((item) => ({
      ingredientId: item.ingredientId,
      quantity: item.quantity,
    }));

    this.inventoryService.addToInventory(inventoryItems);

    // Save purchase
    const currentPurchases = this.purchasesSubject.value;
    currentPurchases.push(purchase);
    this.purchasesSubject.next([...currentPurchases]);
    this.savePurchases();

    return purchase;
  }

  getPurchases(): Purchase[] {
    return this.purchasesSubject.value;
  }

  exportWeeklyData(week: string): WeeklyData | null {
    const menu = this.menuService.getMenuForWeek(week);
    const inventory = this.inventoryService.getInventory();
    const shoppingList = this.storageService.getItem<ShoppingList>(
      `shopping-${week}`
    );
    const purchases = this.purchasesSubject.value.filter(
      (p) => p.weekId === week
    );

    if (!menu) return null;

    return {
      week,
      menu,
      inventory,
      shoppingList: shoppingList || {
        id: "",
        weekId: week,
        items: [],
        totalCost: 0,
        completed: false,
        createdAt: new Date(),
      },
      purchases,
    };
  }

  importWeeklyData(data: WeeklyData): boolean {
    try {
      // Save menu
      this.storageService.setItem(`menu-${data.week}`, data.menu);

      // Update inventory (merge with existing)
      const currentInventory = this.inventoryService.getInventory();
      data.inventory.forEach((ingredient) => {
        const existingIndex = currentInventory.findIndex(
          (item) => item.id === ingredient.id
        );
        if (existingIndex === -1) {
          this.inventoryService.addIngredient(ingredient);
        }
      });

      // Save shopping list
      if (data.shoppingList.id) {
        this.storageService.setItem(`shopping-${data.week}`, data.shoppingList);
      }

      // Add purchases
      const currentPurchases = this.purchasesSubject.value;
      const newPurchases = [...currentPurchases];
      data.purchases.forEach((purchase) => {
        if (!newPurchases.find((p) => p.id === purchase.id)) {
          newPurchases.push(purchase);
        }
      });
      this.purchasesSubject.next(newPurchases);
      this.savePurchases();

      // Load the imported week as current
      this.menuService.loadWeekMenu(data.week);

      return true;
    } catch (error) {
      console.error("Error importing data:", error);
      return false;
    }
  }
}

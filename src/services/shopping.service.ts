import { Injectable } from "@angular/core";
import { signal, WritableSignal } from "@angular/core";
import {
  ShoppingList,
  Purchase,
  WeeklyData,
  ShoppingItem,
  Dish,
} from "../models/interfaces";
import { ShoppingListService } from "./shopping-list.service";
import { MenuService } from "./menu.service";
import { DishesService } from "./dishes.service";
import { InventoryService } from "./inventory.service";
import { WeeklyMenuService } from "./weekly-menu.service";

@Injectable({
  providedIn: "root",
})
export class ShoppingService {
  private shoppingListSignal: WritableSignal<ShoppingList | null> =
    signal(null);
  public shoppingList = this.shoppingListSignal;

  private purchasesSignal: WritableSignal<Purchase[]> = signal([]);
  public purchases = this.purchasesSignal;

  constructor(
    private shoppingListService: ShoppingListService,
    private menuService: MenuService,
    private dishesService: DishesService,
    private inventoryService: InventoryService,
    private weeklyMenuService: WeeklyMenuService
  ) {
    this.loadPurchases();
  }

  public removeItem(index: number): void {
    const currentList = this.shoppingListSignal();
    if (!currentList) return;

    currentList.items.splice(index, 1);
    currentList.totalCost = currentList.items.reduce(
      (total, i) => total + i.quantity * i.pricePerUnit,
      0
    );
    currentList.completed = currentList.items.every((i) => i.purchased);
    this.shoppingListSignal.set({ ...currentList });
    this.shoppingListService.saveShoppingList(currentList);
  }

  private loadPurchases(): void {
    this.shoppingListService.getPurchases().then((purchases) => {
      this.purchasesSignal.set(purchases);
    });
  }
  // Permite agregar un ingrediente manualmente a la lista de compras
  private savePurchases(): void {
    this.purchasesSignal().forEach((purchase) => {
      this.shoppingListService.savePurchase(purchase);
    });
  }

  addManualItem(item: ShoppingItem): void {
    const currentList = this.shoppingListSignal();
    if (!currentList) return;

    currentList.items.push(item);
    currentList.totalCost = currentList.items.reduce(
      (total, i) => total + i.quantity * i.pricePerUnit,
      0
    );
    currentList.completed = currentList.items.every((i) => i.purchased);
    this.shoppingListSignal.set({ ...currentList });
    this.shoppingListService.saveShoppingList(currentList);
  }

  async generateShoppingList(): Promise<ShoppingList | null> {
    const currentMenu = this.menuService.getCurrentMenu();
    const inventory = await this.inventoryService.getInventory();

    if (!currentMenu) return null;

    const requiredIngredients = new Map<string, number>();

    // Calculate required ingredients for all dishes in the menu
    Object.keys(currentMenu.days).forEach((day) => {
      const dishes: Dish[] = currentMenu.days[day];
      dishes.forEach((dish) => {
        dish.ingredients.forEach((ingredient) => {
          const currentRequired =
            requiredIngredients.get(ingredient.ingredientId) || 0;
          requiredIngredients.set(
            ingredient.ingredientId,
            currentRequired + ingredient.quantity
          );
        });
      });
    });

    // Check what we need to buy (subtract current inventory)
    // ...existing code...
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

    this.shoppingListSignal.set(shoppingList);
    this.shoppingListService.saveShoppingList(shoppingList);

    return shoppingList;
  }

  toggleItemPurchased(itemIndex: number): void {
    const currentList = this.shoppingListSignal();
    if (!currentList) return;

    currentList.items[itemIndex].purchased =
      !currentList.items[itemIndex].purchased;
    currentList.completed = currentList.items.every((item) => item.purchased);

    this.shoppingListSignal.set({ ...currentList });
    this.shoppingListService.saveShoppingList(currentList);
  }

  async completePurchase(): Promise<Purchase | null> {
    const shoppingList = this.shoppingListSignal();
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
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      pricePerUnit: item.pricePerUnit,
    }));

    await this.inventoryService.addToInventory(inventoryItems);

    // Save purchase
    const currentPurchases = this.purchasesSignal();
    currentPurchases.push(purchase);
    this.purchasesSignal.set([...currentPurchases]);
    this.savePurchases();

    // Limpiar la lista de compras después de completar
    this.shoppingListSignal.set(null);
    // Si necesitas eliminar la lista, usa el servicio DexieJS
    // await this.shoppingListService.deleteShoppingList(shoppingList.id);

    return purchase;
  }

  getPurchases(): Purchase[] {
    return this.purchasesSignal();
  }

  async exportWeeklyData(week: string): Promise<WeeklyData | null> {
    const menu = await this.menuService.getMenuForWeek(week);
    const inventory = await this.inventoryService.getInventory();
    const shoppingList = await this.shoppingListService.getShoppingList(
      `shopping-${week}`
    );
    const purchases = this.purchasesSignal().filter((p) => p.weekId === week);

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
      // Guardar el menú usando el método adecuado
      this.weeklyMenuService.saveMenu(data.menu);

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
        this.shoppingListService.saveShoppingList(data.shoppingList);
      }

      // Add purchases
      const currentPurchases = this.purchasesSignal();
      const newPurchases = [...currentPurchases];
      data.purchases.forEach((purchase) => {
        if (!newPurchases.find((p) => p.id === purchase.id)) {
          newPurchases.push(purchase);
        }
      });
      this.purchasesSignal.set(newPurchases);
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

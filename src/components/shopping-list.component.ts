import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ShoppingService } from "../services/shopping.service";
import { ShoppingList, ShoppingItem } from "../models/interfaces";
import { InventoryService } from "../services/inventory.service";

@Component({
  selector: "app-shopping-list",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./shopping-list.component.html",
})
export class ShoppingListComponent implements OnInit {
  shoppingList: ShoppingList | null = null;
  newItem: Partial<ShoppingItem> = {
    name: "",
    quantity: 1,
    unit: "unidades",
    pricePerUnit: 0,
  };
  selectedInventoryId: string = "";
  inventory: any[] = [];

  constructor(
    private shoppingService: ShoppingService,
    private inventoryService: InventoryService
  ) {}

  ngOnInit(): void {
    this.shoppingService.shoppingList$.subscribe((list) => {
      this.shoppingList = list;
    });
    this.inventoryService.inventory$.subscribe((inv) => {
      this.inventory = inv;
    });
  }

  public formatPrice(value: number): string {
    return value ? value.toFixed(2) : "0.00";
  }

  onInventorySelect(): void {
    if (!this.selectedInventoryId) return;
    const ing = this.inventory.find((i) => i.id === this.selectedInventoryId);
    if (ing) {
      this.newItem.name = ing.name;
      this.newItem.unit = ing.unit;
      this.newItem.pricePerUnit = ing.pricePerUnit || ing.priceTotal || 0;
      this.newItem.quantity = 1;
    }
  }

  generateList(): void {
    this.shoppingList = this.shoppingService.generateShoppingList();
  }

  addItem(): void {
    if (!this.shoppingList) return;
    if (
      !this.newItem.name ||
      !this.newItem.quantity ||
      !this.newItem.unit ||
      this.newItem.pricePerUnit === undefined
    )
      return;
    this.shoppingService.addManualItem({
      ingredientId: this.selectedInventoryId
        ? this.selectedInventoryId
        : "manual-" + Date.now(),
      name: this.newItem.name,
      quantity: Number(this.newItem.quantity),
      unit: this.newItem.unit,
      pricePerUnit: Number(this.newItem.pricePerUnit),
      purchased: false,
    });
    this.newItem = {
      name: "",
      quantity: 1,
      unit: "unidades",
      pricePerUnit: 0,
    };
    this.selectedInventoryId = "";
  }

  toggleItem(index: number): void {
    this.shoppingService.toggleItemPurchased(index);
    // Si se marcó como comprado, actualizar inventario
    const item = this.shoppingList?.items[index];
    if (item && item.purchased) {
      // Buscar si existe en inventario por nombre y unidad
      let ing = this.inventory.find(
        (i) =>
          i.name.toLowerCase() === item.name.toLowerCase() &&
          i.unit === item.unit
      );
      if (ing) {
        // Sumar cantidad
        ing.quantity += item.quantity;
        this.inventoryService.updateIngredient(ing);
      } else {
        // Crear nuevo ingrediente
        const newIng = {
          id: item.ingredientId,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          pricePerUnit: item.pricePerUnit,
          category: "otros",
        };
        this.inventoryService.addIngredient(newIng);
      }
    }
  }
  removeItem(index: number): void {
    this.shoppingService.removeItem(index);
  }

  markAllAsPurchased(): void {
    if (!this.shoppingList) return;
    this.shoppingList.items.forEach((item, index) => {
      if (!item.purchased) {
        this.shoppingService.toggleItemPurchased(index);
      }
    });
  }

  finalizePurchase(): void {
    const purchase = this.shoppingService.completePurchase();
    if (purchase) {
      alert(
        `¡Compra finalizada! Total: $${purchase.totalCost.toFixed(
          2
        )}\nInventario actualizado.`
      );
      this.shoppingList = null; // Limpiar la lista para evitar repetir compra
    }
  }

  getPurchasedCount(): number {
    return this.shoppingList
      ? this.shoppingList.items.filter((item) => item.purchased).length
      : 0;
  }

  getPendingCount(): number {
    return this.shoppingList
      ? this.shoppingList.items.filter((item) => !item.purchased).length
      : 0;
  }
}

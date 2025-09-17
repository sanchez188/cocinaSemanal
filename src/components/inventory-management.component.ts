import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { InventoryService } from "../services/inventory.service";
import { Ingredient } from "../models/interfaces";

@Component({
  selector: "app-inventory-management",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./inventory-management.component.html",
})
export class InventoryManagementComponent implements OnInit {
  inventoryService = inject(InventoryService);
  inventory = this.inventoryService.inventory;
  groupedInventory = signal<Ingredient[]>([]);
  showAddForm = signal(false);
  editingIngredient = signal<Ingredient | null>(null);
  searchText: string = "";

  ingredientForm = {
    name: "",
    quantity: 0,
    unit: "unidades",
    pricePerUnit: 0,
    category: "otros",
  };

  ngOnInit(): void {
    this.filterInventory();
  }

  filterInventory(): void {
    const text = this.searchText.trim().toLowerCase();
    const allInventory = this.inventory();
    if (!text) {
      this.groupedInventory.set(
        [...allInventory].sort((a, b) => a.name.localeCompare(b.name))
      );
    } else {
      const filtered = allInventory
        .filter(
          (i) =>
            i.name.toLowerCase().includes(text) ||
            i.category.toLowerCase().includes(text)
        )
        .sort((a, b) => a.name.localeCompare(b.name));
      this.groupedInventory.set(filtered);
    }
  }

  async saveIngredient(): Promise<void> {
    if (!this.ingredientForm.name.trim()) return;
    const ingredient: Ingredient = {
      id: this.editingIngredient()
        ? this.editingIngredient()!.id
        : crypto.randomUUID(),
      name: this.ingredientForm.name.trim(),
      quantity: this.ingredientForm.quantity,
      unit: this.ingredientForm.unit,
      pricePerUnit: this.ingredientForm.pricePerUnit,
      category: this.ingredientForm.category,
    };
    try {
      if (this.editingIngredient()) {
        this.inventoryService.updateIngredient(ingredient);
      } else {
        this.inventoryService.addIngredient(ingredient);
      }
      this.filterInventory();
      this.cancelEdit();
    } catch (e) {
      alert("Error al guardar el ingrediente");
    }
  }

  editIngredient(ingredient: Ingredient): void {
    this.editingIngredient.set(ingredient);
    this.ingredientForm = {
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      pricePerUnit: ingredient.pricePerUnit,
      category: ingredient.category,
    };
    this.showAddForm.set(true);
  }

  deleteIngredient(id: string): void {
    if (confirm("¿Estás seguro de que quieres eliminar este ingrediente?")) {
      this.inventoryService.removeIngredient(id);
      this.filterInventory();
    }
  }

  cancelEdit(): void {
    this.showAddForm.set(false);
    this.editingIngredient.set(null);
    this.ingredientForm = {
      name: "",
      quantity: 0,
      unit: "unidades",
      pricePerUnit: 0,
      category: "otros",
    };
  }

  getStockStatus(quantity: number): string {
    if (quantity <= 0) return "Agotado";
    if (quantity <= 5) return "Bajo";
    return "Normal";
  }

  getStockStatusClass(quantity: number): string {
    if (quantity <= 0) return "bg-red-100 text-red-800";
    if (quantity <= 5) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  }

  getTotalInventoryValue(): number {
    return this.inventory().reduce(
      (total: number, item: Ingredient) =>
        total + item.quantity * item.pricePerUnit,
      0
    );
  }

  getLowStockCount(): number {
    return this.inventory().filter((item: Ingredient) => item.quantity <= 5)
      .length;
  }

  formatNumber(value: number): string {
    return value.toFixed(2);
  }

  private showSuccessMessage(message: string): void {
    const notification = document.createElement("div");
    notification.className =
      "fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300";
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
}

import { Component, OnInit } from "@angular/core";
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
  inventory: Ingredient[] = [];
  groupedInventory: Ingredient[] = [];
  showAddForm = false;
  editingIngredient: Ingredient | null = null;
  searchText: string = "";

  ingredientForm = {
    name: "",
    quantity: 0,
    unit: "unidades",
    pricePerUnit: 0,
    category: "otros",
  };

  constructor(private inventoryService: InventoryService) {}

  ngOnInit(): void {
    this.inventoryService.inventory$.subscribe((inventory) => {
      this.inventory = inventory;
      this.filterInventory();
    });
  }

  filterInventory(): void {
    const text = this.searchText.trim().toLowerCase();
    if (!text) {
      this.groupedInventory = [...this.inventory].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    } else {
      this.groupedInventory = this.inventory
        .filter(
          (i) =>
            i.name.toLowerCase().includes(text) ||
            i.category.toLowerCase().includes(text)
        )
        .sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  saveIngredient(): void {
    if (!this.ingredientForm.name.trim()) return;

    const ingredient: Ingredient = {
      id: this.editingIngredient
        ? this.editingIngredient.id
        : `ingredient-${Date.now()}`,
      name: this.ingredientForm.name.trim(),
      quantity: this.ingredientForm.quantity,
      unit: this.ingredientForm.unit,
      pricePerUnit: this.ingredientForm.pricePerUnit,
      category: this.ingredientForm.category,
    };

    if (this.editingIngredient) {
      this.inventoryService.updateIngredient(ingredient);
    } else {
      this.inventoryService.addIngredient(ingredient);
    }

    this.cancelEdit();
  }

  editIngredient(ingredient: Ingredient): void {
    this.editingIngredient = ingredient;
    this.ingredientForm = {
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      pricePerUnit: ingredient.pricePerUnit,
      category: ingredient.category,
    };
    this.showAddForm = true;
  }

  deleteIngredient(id: string): void {
    if (confirm("¿Estás seguro de que quieres eliminar este ingrediente?")) {
      this.inventoryService.removeIngredient(id);
    }
  }

  cancelEdit(): void {
    this.showAddForm = false;
    this.editingIngredient = null;
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
    return this.inventory.reduce(
      (total, item) => total + item.quantity * item.pricePerUnit,
      0
    );
  }

  getLowStockCount(): number {
    return this.inventory.filter((item) => item.quantity <= 5).length;
  }

  formatNumber(value: number): string {
    return value.toFixed(2);
  }
}

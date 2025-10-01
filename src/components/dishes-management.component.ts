import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DishesService } from "../services/dishes.service";
import { InventoryService } from "../services/inventory.service";
import {
  Dish,
  Ingredient,
  DishIngredient,
  MEAL_CATEGORIES,
  MealCategory,
} from "../models/interfaces";

@Component({
  selector: "app-dishes-management",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Gestión de Platillos</h2>
          <p class="text-gray-600">Crea y administra tus recetas</p>
        </div>
        <button
          (click)="showAddForm = !showAddForm"
          class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          {{ showAddForm ? "Cancelar" : "+ Nuevo Platillo" }}
        </button>
      </div>

      <!-- Add/Edit Form -->
      <div
        *ngIf="showAddForm"
        class="bg-white rounded-lg shadow-sm border p-6 mb-6"
      >
        <h3 class="text-lg font-semibold mb-4">
          {{ editingDish ? "Editar" : "Nuevo" }} Platillo
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"
              >Nombre del platillo</label
            >
            <input
              type="text"
              [(ngModel)]="dishForm.name"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              placeholder="Ej: Huevos revueltos"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"
              >Categoría</label
            >
            <select
              [(ngModel)]="dishForm.category"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            >
              <option *ngFor="let meal of mealCategories" [value]="meal.id">
                {{ meal.icon }} {{ meal.label }}
              </option>
            </select>
          </div>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2"
            >Porciones</label
          >
          <input
            type="number"
            [(ngModel)]="dishForm.servings"
            min="1"
            class="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
          />
        </div>

        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2"
            >Ingredientes</label
          >
          <div class="space-y-3">
            <div
              *ngFor="let ingredient of dishForm.ingredients; let i = index"
              class="flex flex-col md:flex-row items-stretch md:items-center space-y-2 md:space-y-0 md:space-x-3 p-3 bg-gray-50 rounded-lg"
            >
              <select
                [(ngModel)]="ingredient.ingredientId"
                class="w-full md:flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Seleccionar ingrediente</option>
                <option *ngFor="let inv of inventory" [value]="inv.id">
                  {{ inv.name }} ({{ inv.unit }})
                </option>
              </select>

              <input
                type="number"
                [(ngModel)]="ingredient.quantity"
                placeholder="Cantidad"
                class="w-full md:w-24 px-3 py-2 border border-gray-300 rounded-md text-sm"
                step="0.1"
                min="0"
              />

              <button
                (click)="removeIngredient(i)"
                class="px-3 py-2 text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          </div>

          <button
            (click)="addIngredient()"
            class="mt-3 px-4 py-2 text-green-600 hover:text-green-700 text-sm"
          >
            + Agregar ingrediente
          </button>
        </div>

        <div class="flex space-x-3">
          <button
            (click)="saveDish()"
            class="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            {{ editingDish ? "Actualizar" : "Guardar" }}
          </button>
          <button
            (click)="cancelEdit()"
            class="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancelar
          </button>
        </div>
      </div>

      <!-- Dishes List -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          *ngFor="let dish of dishes"
          class="bg-white rounded-lg shadow-sm border p-4"
        >
          <div class="flex justify-between items-start mb-3">
            <div>
              <h3 class="font-semibold text-lg">{{ dish.name }}</h3>
              <span
                class="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full capitalize"
              >
                {{ dish.category }}
              </span>
            </div>
            <div class="flex space-x-2">
              <button
                (click)="editDish(dish)"
                class="text-blue-500 hover:text-blue-700"
              >
                ✏️
              </button>
              <button
                (click)="deleteDish(dish.id)"
                class="text-red-500 hover:text-red-700"
              >
                🗑️
              </button>
            </div>
          </div>

          <div class="text-sm text-gray-600 mb-3">
            <p>Porciones: {{ dish.servings }}</p>
          </div>

          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-2">
              Ingredientes:
            </h4>
            <ul class="text-sm text-gray-600 space-y-1">
              <li *ngFor="let ingredient of dish.ingredients">
                {{ getIngredientName(ingredient.ingredientId) }}:
                {{ ingredient.quantity }}
                {{ getIngredientUnit(ingredient.ingredientId) }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DishesManagementComponent implements OnInit {
  // Usar signal directamente en el template para reactividad automática
  get dishes() {
    return this.dishesService.dishes();
  }
  inventory: Ingredient[] = [];
  showAddForm = false;
  editingDish: Dish | null = null;
  mealCategories = MEAL_CATEGORIES;

  dishForm = {
    name: "",
    category: "desayuno" as MealCategory,
    servings: 1,
    ingredients: [] as DishIngredient[],
  };

  constructor(
    private dishesService: DishesService,
    private inventoryService: InventoryService
  ) {}

  ngOnInit(): void {
    this.inventory = this.inventoryService.inventory();
  }

  addIngredient(): void {
    this.dishForm.ingredients.push({
      ingredientId: "",
      quantity: 0,
    });
  }

  removeIngredient(index: number): void {
    this.dishForm.ingredients.splice(index, 1);
  }

  async saveDish(): Promise<void> {
    if (!this.dishForm.name.trim()) return;

    const validIngredients = this.dishForm.ingredients.filter(
      (ingredient) => ingredient.ingredientId && ingredient.quantity > 0
    );

    const dish: Dish = {
      id: this.editingDish ? this.editingDish.id : `dish-${Date.now()}`,
      name: this.dishForm.name.trim(),
      category: this.dishForm.category,
      servings: this.dishForm.servings,
      ingredients: validIngredients,
    };

    if (this.editingDish) {
      await this.dishesService.updateDish(dish);
    } else {
      await this.dishesService.addDish(dish);
    }

    this.cancelEdit();
  }

  editDish(dish: Dish): void {
    this.editingDish = dish;
    this.dishForm = {
      name: dish.name,
      category: dish.category,
      servings: dish.servings,
      ingredients: [...dish.ingredients],
    };
    this.showAddForm = true;
  }

  async deleteDish(id: string): Promise<void> {
    if (confirm("¿Estás seguro de que quieres eliminar este platillo?")) {
      await this.dishesService.removeDish(id);
    }
  }

  cancelEdit(): void {
    this.showAddForm = false;
    this.editingDish = null;
    this.dishForm = {
      name: "",
      category: "desayuno" as MealCategory,
      servings: 1,
      ingredients: [],
    };
  }

  getIngredientName(id: string): string {
    const ingredient = this.inventory.find((item) => item.id === id);
    return ingredient ? ingredient.name : "Desconocido";
  }

  getIngredientUnit(id: string): string {
    const ingredient = this.inventory.find((item) => item.id === id);
    return ingredient ? ingredient.unit : "";
  }
}

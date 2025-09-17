import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DishesService } from "../services/dishes.service";
import { InventoryService } from "../services/inventory.service";
import { Dish, Ingredient, DishIngredient } from "../models/interfaces";

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
          (click)="showAddForm.set(!showAddForm())"
          class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          {{ showAddForm() ? "Cancelar" : "+ Nuevo Platillo" }}
        </button>
      </div>

      <!-- Add/Edit Form -->
      @if (showAddForm()) {
        <div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h3 class="text-lg font-semibold mb-4">
            {{ editingDish() ? "Editar" : "Nuevo" }} Platillo
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Nombre del platillo
              </label>
              <input
                type="text"
                [(ngModel)]="dishForm.name"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                placeholder="Ej: Huevos revueltos"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                [(ngModel)]="dishForm.category"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              >
                <option value="desayuno">Desayuno</option>
                <option value="almuerzo">Almuerzo</option>
                <option value="cafe">Café</option>
                <option value="cena">Cena</option>
              </select>
            </div>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Porciones
            </label>
            <input
              type="number"
              [(ngModel)]="dishForm.servings"
              min="1"
              class="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Ingredientes
            </label>
            <div class="space-y-3">
              @for (ingredient of dishForm.ingredients; track $index; let i = $index) {
                <div class="flex flex-col md:flex-row items-stretch md:items-center space-y-2 md:space-y-0 md:space-x-3 p-3 bg-gray-50 rounded-lg">
                  <select
                    [(ngModel)]="ingredient.ingredientId"
                    class="w-full md:flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Seleccionar ingrediente</option>
                    @for (inv of inventory(); track inv.id) {
                      <option [value]="inv.id">
                        {{ inv.name }} ({{ inv.unit }})
                      </option>
                    }
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
                    class="px-3 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                  >
                    ✕
                  </button>
                </div>
              }
            </div>

            <button
              (click)="addIngredient()"
              class="mt-3 px-4 py-2 text-green-600 hover:text-green-700 text-sm hover:bg-green-50 rounded transition-colors"
            >
              + Agregar ingrediente
            </button>
          </div>

          <div class="flex space-x-3">
            <button
              (click)="saveDish()"
              [disabled]="!dishForm.name.trim()"
              class="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ editingDish() ? "Actualizar" : "Guardar" }}
            </button>
            <button
              (click)="cancelEdit()"
              class="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      }

      <!-- Dishes List -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @if (dishes().length === 0) {
          <div class="col-span-full text-center py-12">
            <div class="text-gray-400 text-6xl mb-4">🍽️</div>
            <h3 class="text-xl font-semibold text-gray-700 mb-2">
              No hay platillos registrados
            </h3>
            <p class="text-gray-500">Crea tu primer platillo para comenzar</p>
          </div>
        }

        @for (dish of dishes(); track dish.id) {
          <div class="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
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
                  class="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded transition-colors"
                  title="Editar platillo"
                >
                  ✏️
                </button>
                <button
                  (click)="deleteDish(dish.id)"
                  class="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                  title="Eliminar platillo"
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
                @for (ingredient of dish.ingredients; track ingredient.ingredientId) {
                  <li class="flex justify-between">
                    <span>{{ getIngredientName(ingredient.ingredientId) }}</span>
                    <span class="font-medium">
                      {{ ingredient.quantity }} {{ getIngredientUnit(ingredient.ingredientId) }}
                    </span>
                  </li>
                }
                @if (dish.ingredients.length === 0) {
                  <li class="text-gray-400 italic">Sin ingredientes</li>
                }
              </ul>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class DishesManagementComponent implements OnInit {
  private dishesService = inject(DishesService);
  private inventoryService = inject(InventoryService);

  dishes = signal<Dish[]>([]);
  inventory = signal<Ingredient[]>([]);
  showAddForm = signal(false);
  editingDish = signal<Dish | null>(null);

  dishForm = {
    name: "",
    category: "desayuno" as "desayuno" | "almuerzo" | "cafe" | "cena",
    servings: 1,
    ingredients: [] as DishIngredient[],
  };

  ngOnInit(): void {
    this.dishesService.dishes$.subscribe((dishes) => {
      this.dishes.set(dishes);
    });

    this.inventoryService.inventory$.subscribe((inventory) => {
      this.inventory.set(inventory);
    });
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
      id: this.editingDish() ? this.editingDish()!.id : `dish-${Date.now()}`,
      name: this.dishForm.name.trim(),
      category: this.dishForm.category,
      servings: this.dishForm.servings,
      ingredients: validIngredients,
    };

    try {
      if (this.editingDish()) {
        await this.dishesService.updateDish(dish);
      } else {
        await this.dishesService.addDish(dish);
      }

      this.cancelEdit();
      this.showSuccessMessage(
        `Platillo "${dish.name}" ${this.editingDish() ? 'actualizado' : 'guardado'} exitosamente`
      );
    } catch (error) {
      console.error('Error saving dish:', error);
      alert('Error al guardar el platillo. Inténtalo de nuevo.');
    }
  }

  editDish(dish: Dish): void {
    this.editingDish.set(dish);
    this.dishForm = {
      name: dish.name,
      category: dish.category,
      servings: dish.servings,
      ingredients: [...dish.ingredients],
    };
    this.showAddForm.set(true);
  }

  async deleteDish(id: string): Promise<void> {
    const dish = this.dishes().find(d => d.id === id);
    if (!confirm(`¿Estás seguro de que quieres eliminar "${dish?.name}"?`)) {
      return;
    }

    try {
      await this.dishesService.removeDish(id);
      this.showSuccessMessage('Platillo eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting dish:', error);
      alert('Error al eliminar el platillo. Inténtalo de nuevo.');
    }
  }

  cancelEdit(): void {
    this.showAddForm.set(false);
    this.editingDish.set(null);
    this.dishForm = {
      name: "",
      category: "desayuno",
      servings: 1,
      ingredients: [],
    };
  }

  getIngredientName(id: string): string {
    const ingredient = this.inventory().find((item) => item.id === id);
    return ingredient ? ingredient.name : "Desconocido";
  }

  getIngredientUnit(id: string): string {
    const ingredient = this.inventory().find((item) => item.id === id);
    return ingredient ? ingredient.unit : "";
  }

  private showSuccessMessage(message: string): void {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
}
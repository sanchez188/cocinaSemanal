import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { InventoryService } from "../services/inventory.service";
import { Ingredient } from "../models/interfaces";

@Component({
  selector: "app-inventory-management",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Inventario</h2>
          <p class="text-gray-600">Gestiona tus ingredientes y existencias</p>
        </div>
        <button
          (click)="showAddForm.set(!showAddForm())"
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          {{ showAddForm() ? "Cancelar" : "+ Nuevo Ingrediente" }}
        </button>
      </div>

      <!-- Add/Edit Form -->
      @if (showAddForm()) {
        <div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h3 class="text-lg font-semibold mb-4">
            {{ editingIngredient() ? "Editar" : "Nuevo" }} Ingrediente
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Nombre
              </label>
              <input
                type="text"
                [(ngModel)]="ingredientForm.name"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Huevos"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Cantidad
              </label>
              <input
                type="number"
                [(ngModel)]="ingredientForm.quantity"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="30"
                step="0.1"
                min="0"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Unidad
              </label>
              <select
                [(ngModel)]="ingredientForm.unit"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="unidades">Unidades</option>
                <option value="kg">Kilogramos</option>
                <option value="Latas">Latas</option>
                <option value="g">Gramos</option>
                <option value="litro">Litros</option>
                <option value="ml">Mililitros</option>
                <option value="tazas">Tazas</option>
                <option value="cucharadas">Cucharadas</option>
                <option value="cucharaditas">Cucharaditas</option>
                <option value="paquete">Paquetes</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Precio por unidad
              </label>
              <input
                type="number"
                [(ngModel)]="ingredientForm.pricePerUnit"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.50"
                step="0.01"
                min="0"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                [(ngModel)]="ingredientForm.category"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="carnes">Carnes</option>
                <option value="verduras">Verduras</option>
                <option value="frutas">Frutas</option>
                <option value="lacteos">Lácteos</option>
                <option value="cereales">Cereales</option>
                <option value="galletas">Galletas</option>
                <option value="especias">Especias</option>
                <option value="limpieza">Limpieza</option>
                <option value="otros">Otros</option>
              </select>
            </div>
          </div>

          <div class="flex space-x-3">
            <button
              (click)="saveIngredient()"
              [disabled]="!ingredientForm.name.trim()"
              class="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ editingIngredient() ? "Actualizar" : "Guardar" }}
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

      <!-- Search Input -->
      <div class="mb-4 flex justify-end">
        <input
          type="text"
          [(ngModel)]="searchText"
          (ngModelChange)="filterInventory()"
          class="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder="Buscar ingrediente o categoría..."
        />
      </div>

      <!-- Inventory List -->
      <div class="bg-white rounded-lg shadow-sm border">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ingrediente
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio/Unit
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Total
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              @if (groupedInventory().length === 0) {
                <tr>
                  <td colspan="6" class="px-6 py-12 text-center">
                    <div class="text-gray-400 text-4xl mb-4">📦</div>
                    <h3 class="text-lg font-semibold text-gray-700 mb-2">
                      No hay ingredientes
                    </h3>
                    <p class="text-gray-500">
                      {{ searchText ? 'No se encontraron resultados' : 'Agrega tu primer ingrediente' }}
                    </p>
                  </td>
                </tr>
              }

              @for (ingredient of groupedInventory(); track ingredient.id) {
                <tr [class.bg-red-50]="ingredient.quantity <= 5" class="hover:bg-gray-50 transition-colors">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div>
                        <div class="text-sm font-medium text-gray-900">
                          {{ ingredient.name }}
                        </div>
                        <div class="text-sm text-gray-500 capitalize">
                          {{ ingredient.category }}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ ingredient.quantity }} {{ ingredient.unit }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${{ formatNumber(ingredient.pricePerUnit) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${{ formatNumber(ingredient.quantity * ingredient.pricePerUnit) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                      [class]="getStockStatusClass(ingredient.quantity)"
                    >
                      {{ getStockStatus(ingredient.quantity) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      (click)="editIngredient(ingredient)"
                      class="text-blue-600 hover:text-blue-900 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      (click)="deleteIngredient(ingredient.id)"
                      class="text-red-600 hover:text-red-900 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Summary -->
      <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white rounded-lg shadow-sm border p-4">
          <div class="text-sm font-medium text-gray-500">Total Ingredientes</div>
          <div class="text-2xl font-bold text-gray-900">{{ inventory().length }}</div>
        </div>
        <div class="bg-white rounded-lg shadow-sm border p-4">
          <div class="text-sm font-medium text-gray-500">Valor Total Inventario</div>
          <div class="text-2xl font-bold text-green-600">
            ${{ formatNumber(getTotalInventoryValue()) }}
          </div>
        </div>
        <div class="bg-white rounded-lg shadow-sm border p-4">
          <div class="text-sm font-medium text-gray-500">Ingredientes Bajos</div>
          <div class="text-2xl font-bold text-red-600">{{ getLowStockCount() }}</div>
        </div>
      </div>
    </div>
  `,
})
export class InventoryManagementComponent implements OnInit {
  private inventoryService = inject(InventoryService);

  inventory = signal<Ingredient[]>([]);
  groupedInventory = signal<Ingredient[]>([]);
  showAddForm = signal(false);
  editingIngredient = signal<Ingredient | null>(null);
  searchText = "";

  ingredientForm = {
    name: "",
    quantity: 0,
    unit: "unidades",
    pricePerUnit: 0,
    category: "otros",
  };

  ngOnInit(): void {
    this.inventoryService.inventory$.subscribe((inventory) => {
      this.inventory.set(inventory);
      this.filterInventory();
    });
  }

  filterInventory(): void {
    const text = this.searchText.trim().toLowerCase();
    const allInventory = this.inventory();
    
    if (!text) {
      this.groupedInventory.set([...allInventory].sort((a, b) => a.name.localeCompare(b.name)));
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
        await this.inventoryService.updateIngredient(ingredient);
      } else {
        await this.inventoryService.addIngredient(ingredient);
      }

      this.cancelEdit();
      this.showSuccessMessage(
        `Ingrediente "${ingredient.name}" ${this.editingIngredient() ? 'actualizado' : 'guardado'} exitosamente`
      );
    } catch (error) {
      console.error('Error saving ingredient:', error);
      alert('Error al guardar el ingrediente. Inténtalo de nuevo.');
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

  async deleteIngredient(id: string): Promise<void> {
    const ingredient = this.inventory().find(i => i.id === id);
    if (!confirm(`¿Estás seguro de que quieres eliminar "${ingredient?.name}"?`)) {
      return;
    }

    try {
      await this.inventoryService.removeIngredient(id);
      this.showSuccessMessage('Ingrediente eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      alert('Error al eliminar el ingrediente. Inténtalo de nuevo.');
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
      (total, item) => total + item.quantity * item.pricePerUnit,
      0
    );
  }

  getLowStockCount(): number {
    return this.inventory().filter((item) => item.quantity <= 5).length;
  }

  formatNumber(value: number): string {
    return value.toFixed(2);
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
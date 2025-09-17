import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ShoppingService } from "../services/shopping.service";
import { ShoppingList, ShoppingItem } from "../models/interfaces";
import { InventoryService } from "../services/inventory.service";

@Component({
  selector: "app-shopping-list",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Lista de Compras</h2>
          <p class="text-gray-600">
            Organiza tus compras según el menú semanal
          </p>
        </div>
        <button
          (click)="generateList()"
          class="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          🔄 Generar Lista
        </button>
      </div>

      @if (!shoppingList()) {
      <div class="text-center py-12">
        <div class="text-gray-400 text-6xl mb-4">🛒</div>
        <h3 class="text-xl font-semibold text-gray-700 mb-2">
          No hay lista de compras
        </h3>
        <p class="text-gray-500 mb-4">
          Genera una lista basada en tu menú semanal
        </p>
        <button
          (click)="generateList()"
          class="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Generar Lista de Compras
        </button>
      </div>
      } @else {
      <div class="space-y-6">
        <!-- Add Item Form -->
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <h3 class="text-lg font-semibold mb-4">
            Agregar ingrediente a la lista
          </h3>
          <form
            class="grid grid-cols-1 md:grid-cols-6 gap-4 items-end"
            (ngSubmit)="addItem()"
          >
            <div>
              <label class="block text-xs font-semibold mb-1">
                Ingrediente existente
              </label>
              <select
                class="border p-2 rounded w-full"
                [(ngModel)]="selectedInventoryId"
                name="selectedInventoryId"
                (change)="onInventorySelect()"
              >
                <option value="">-- Nuevo ingrediente --</option>
                @for (ing of inventory(); track ing.id) {
                <option [value]="ing.id">{{ ing.name }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1">Nombre</label>
              <input
                class="border p-2 rounded w-full"
                type="text"
                [(ngModel)]="newItem.name"
                name="name"
                required
              />
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1">Cantidad</label>
              <input
                class="border p-2 rounded w-full"
                type="number"
                [(ngModel)]="newItem.quantity"
                name="quantity"
                required
                min="0.01"
                step="0.01"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1">Tipo</label>
              <select
                class="border p-2 rounded w-full"
                [(ngModel)]="newItem.unit"
                name="unit"
                required
              >
                <option value="unidades">Unidades</option>
                <option value="kg">Kilogramos</option>
                <option value="l">Litros</option>
                <option value="paquete">Paquete</option>
                <option value="g">Gramos</option>
                <option value="ml">Mililitros</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1">
                Precio/U o Total
              </label>
              <input
                class="border p-2 rounded w-full"
                type="number"
                step="0.01"
                [(ngModel)]="newItem.pricePerUnit"
                name="pricePerUnit"
                required
                min="0"
              />
            </div>
            <button
              class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              type="submit"
            >
              Agregar
            </button>
          </form>
        </div>

        <!-- Summary -->
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">Resumen de Compra</h3>
            <div class="text-right">
              <div class="text-sm text-gray-500">Total estimado</div>
              <div class="text-2xl font-bold text-orange-600">
                $ {{ formatPrice(shoppingList()!.totalCost) }}
              </div>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <div class="text-2xl font-bold text-gray-900">
                {{ shoppingList()!.items.length }}
              </div>
              <div class="text-sm text-gray-500">Artículos</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-green-600">
                {{ getPurchasedCount() }}
              </div>
              <div class="text-sm text-gray-500">Comprados</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-gray-600">
                {{ getPendingCount() }}
              </div>
              <div class="text-sm text-gray-500">Pendientes</div>
            </div>
          </div>
        </div>

        <!-- Shopping Items -->
        <div class="bg-white rounded-lg shadow-sm border">
          <div class="p-4 border-b">
            <h3 class="text-lg font-semibold">Lista de Ingredientes</h3>
          </div>

          <div class="divide-y divide-gray-200">
            @for (item of shoppingList()!.items; track item.ingredientId; let i
            = $index) {
            <div
              class="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              [class.bg-green-50]="item.purchased"
            >
              <div class="flex items-center space-x-4">
                <input
                  type="checkbox"
                  [checked]="item.purchased"
                  (change)="toggleItem(i)"
                  class="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <div
                  [class.line-through]="item.purchased"
                  [class.text-gray-500]="item.purchased"
                >
                  <div class="font-medium">{{ item.name }}</div>
                  <div class="text-sm text-gray-500">
                    {{ item.quantity }} {{ item.unit }} × $
                    {{ formatPrice(item.pricePerUnit) }}
                  </div>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <div class="text-right">
                  <div
                    class="font-semibold"
                    [class.line-through]="item.purchased"
                    [class.text-gray-500]="item.purchased"
                  >
                    $ {{ formatPrice(item.quantity * item.pricePerUnit) }}
                  </div>
                </div>
                <button
                  class="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  (click)="removeItem(i)"
                  title="Eliminar"
                >
                  🗑️
                </button>
              </div>
            </div>
            }
          </div>
        </div>

        <!-- Actions -->
        <div class="flex space-x-4">
          <button
            (click)="markAllAsPurchased()"
            class="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            ✓ Marcar Todo Como Comprado
          </button>
        </div>

        @if (shoppingList()!.completed) {
        <div
          class="bg-green-50 border border-green-200 rounded-lg p-6 text-center"
        >
          <div class="text-green-600 text-4xl mb-4">✅</div>
          <h3 class="text-xl font-semibold text-green-800 mb-2">
            ¡Compra Completada!
          </h3>
          <p class="text-green-700 mb-4">
            Todos los elementos han sido marcados como comprados
          </p>
          <button
            (click)="finalizePurchase()"
            class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            📝 Finalizar Compra y Actualizar Inventario
          </button>
        </div>
        }
      </div>
      }
    </div>
  `,
})
export class ShoppingListComponent implements OnInit {
  private shoppingService = inject(ShoppingService);
  private inventoryService = inject(InventoryService);

  shoppingList = this.shoppingService.shoppingList;
  inventory = this.inventoryService.inventory;

  newItem: Partial<ShoppingItem> = {
    name: "",
    quantity: 1,
    unit: "unidades",
    pricePerUnit: 0,
  };
  selectedInventoryId: string = "";

  ngOnInit(): void {
    // Si quieres reactividad automática en la plantilla, usa signals directamente en el template
  }

  formatPrice(value: number): string {
    return value ? value.toFixed(2) : "0.00";
  }

  onInventorySelect(): void {
    if (!this.selectedInventoryId) return;
    const ing = this.inventory().find((i) => i.id === this.selectedInventoryId);
    if (ing) {
      this.newItem.name = ing.name;
      this.newItem.unit = ing.unit;
      this.newItem.pricePerUnit = ing.pricePerUnit || ing.priceTotal || 0;
      this.newItem.quantity = 1;
    }
  }

  async generateList(): Promise<void> {
    await this.shoppingService.generateShoppingList();
    // La signal se actualiza automáticamente
  }

  async addItem(): Promise<void> {
    const currentList = this.shoppingList();
    if (!currentList) return;

    if (
      !this.newItem.name ||
      !this.newItem.quantity ||
      !this.newItem.unit ||
      this.newItem.pricePerUnit === undefined
    )
      return;

    this.shoppingService.addManualItem({
      ingredientId: this.selectedInventoryId || "manual-" + Date.now(),
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

  async toggleItem(index: number): Promise<void> {
    await this.shoppingService.toggleItemPurchased(index);
    // La lógica de inventario debe estar en el servicio de compras, no aquí
  }

  async removeItem(index: number): Promise<void> {
    this.shoppingService.removeItem(index);
  }

  async markAllAsPurchased(): Promise<void> {
    const currentList = this.shoppingList();
    if (!currentList) return;

    for (let i = 0; i < currentList.items.length; i++) {
      if (!currentList.items[i].purchased) {
        await this.shoppingService.toggleItemPurchased(i);
      }
    }
    // La signal se actualiza automáticamente
  }

  async finalizePurchase(): Promise<void> {
    const purchase = await this.shoppingService.completePurchase();
    if (purchase) {
      this.showSuccessMessage(
        `¡Compra finalizada! Total: $${purchase.totalCost.toFixed(
          2
        )} - Inventario actualizado.`
      );
      this.shoppingList.set(null);
    }
  }

  getPurchasedCount(): number {
    const list = this.shoppingList();
    return list ? list.items.filter((item) => item.purchased).length : 0;
  }

  getPendingCount(): number {
    const list = this.shoppingList();
    return list ? list.items.filter((item) => !item.purchased).length : 0;
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

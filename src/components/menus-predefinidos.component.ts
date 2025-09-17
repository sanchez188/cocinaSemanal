import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Dish } from "../models/interfaces";
import { DatabaseService, PredefinedMenu } from "../services/database.service";
import { DishesService } from "../services/dishes.service";
import { MenuService } from "../services/menu.service";

@Component({
  selector: "app-menus-predefinidos",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Menús Semanales Predefinidos</h2>
          <p class="text-gray-600">Crea y gestiona plantillas de menús reutilizables</p>
        </div>
        <button
          (click)="showAddForm.set(!showAddForm())"
          class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          {{ showAddForm() ? "Cancelar" : "+ Nuevo Menú Predefinido" }}
        </button>
      </div>

      <!-- Add Form -->
      @if (showAddForm()) {
        <div class="mb-6 bg-white rounded-lg shadow-sm border p-6">
          <h3 class="text-lg font-semibold mb-4">Nuevo Menú Predefinido</h3>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Nombre del menú
            </label>
            <input
              type="text"
              [(ngModel)]="newMenuName"
              placeholder="Ej: Menú Saludable Semana 1"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            />
          </div>

          @for (day of daysOfWeek; track day) {
            <div class="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 class="font-medium mb-3 text-lg capitalize">{{ day }}</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                @for (type of mealTypes; track type) {
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1 capitalize">
                      {{ type }}
                    </label>
                    <select
                      [(ngModel)]="newMenuDays()[day][type]"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-sm"
                    >
                      <option [ngValue]="undefined">-- Sin platillo --</option>
                      @for (dish of dishesFilteredByType(type); track dish.id) {
                        <option [ngValue]="dish.id">{{ dish.name }}</option>
                      }
                    </select>
                  </div>
                }
              </div>
            </div>
          }

          <div class="flex space-x-3">
            <button
              (click)="saveNewMenu()"
              [disabled]="!newMenuName.trim()"
              class="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Guardar Menú
            </button>
            <button
              (click)="cancelForm()"
              class="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      }

      <!-- Predefined Menus List -->
      <div class="space-y-4">
        @if (predefinedMenus().length === 0) {
          <div class="text-center py-12">
            <div class="text-gray-400 text-6xl mb-4">📋</div>
            <h3 class="text-xl font-semibold text-gray-700 mb-2">
              No hay menús predefinidos
            </h3>
            <p class="text-gray-500">Crea tu primer menú predefinido para reutilizarlo</p>
          </div>
        }

        @for (menu of predefinedMenus(); track menu.id) {
          <div class="bg-white rounded-lg shadow-sm border p-6">
            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="text-lg font-semibold text-gray-800">{{ menu.name }}</h3>
                <p class="text-sm text-gray-500">
                  Creado: {{ formatDate(menu.createdAt) }}
                </p>
              </div>
              <div class="flex space-x-2">
                <button
                  (click)="useMenu(menu)"
                  class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  🔄 Usar este menú
                </button>
                <button
                  (click)="deleteMenu(menu.id)"
                  class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>

            <!-- Menu Preview -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              @for (day of daysOfWeek; track day) {
                <div class="bg-gray-50 rounded-lg p-3">
                  <h4 class="font-medium text-sm text-gray-700 mb-2 capitalize">{{ day }}</h4>
                  <div class="space-y-1">
                    @for (dish of menu.days[day]; track dish.id) {
                      <div class="text-xs bg-white rounded px-2 py-1">
                        <span class="font-medium">{{ dish.name }}</span>
                        <span class="text-gray-500 ml-1">({{ dish.category }})</span>
                      </div>
                    }
                    @if (menu.days[day].length === 0) {
                      <div class="text-xs text-gray-400 italic">Sin platillos</div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class MenusPredefinidosComponent implements OnInit {
  private db = inject(DatabaseService);
  private dishesService = inject(DishesService);
  private menuService = inject(MenuService);

  predefinedMenus = signal<PredefinedMenu[]>([]);
  dishes = signal<Dish[]>([]);
  showAddForm = signal(false);
  newMenuName = "";
  newMenuDays = signal<{ [day: string]: { [type: string]: string | undefined } }>({});

  mealTypes = ["desayuno", "almuerzo", "cafe", "cena"];
  daysOfWeek = [
    "lunes",
    "martes",
    "miercoles",
    "jueves",
    "viernes",
    "sabado",
    "domingo",
  ];

  ngOnInit(): void {
    this.loadMenus();
    this.loadDishes();
    this.initializeNewMenuDays();
  }

  private async loadMenus(): Promise<void> {
    try {
      const menus = await this.db.predefinedMenus.orderBy('createdAt').reverse().toArray();
      this.predefinedMenus.set(menus);
    } catch (error) {
      console.error('Error loading predefined menus:', error);
    }
  }

  private async loadDishes(): Promise<void> {
    try {
      const dishes = await this.db.dishes.toArray();
      this.dishes.set(dishes);
    } catch (error) {
      console.error('Error loading dishes:', error);
    }
  }

  private initializeNewMenuDays(): void {
    const menuDays: { [day: string]: { [type: string]: string | undefined } } = {};
    
    for (const day of this.daysOfWeek) {
      menuDays[day] = {};
      for (const type of this.mealTypes) {
        menuDays[day][type] = undefined;
      }
    }
    
    this.newMenuDays.set(menuDays);
  }

  dishesFilteredByType(type: string): Dish[] {
    return this.dishes().filter((d) => d.category === type);
  }

  async saveNewMenu(): Promise<void> {
    if (!this.newMenuName.trim()) return;

    try {
      const menu: PredefinedMenu = {
        id: "menu-" + Date.now(),
        name: this.newMenuName.trim(),
        days: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      for (const day of this.daysOfWeek) {
        menu.days[day] = [];
        for (const type of this.mealTypes) {
          const dishId = this.newMenuDays()[day][type];
          if (dishId) {
            const dish = this.dishes().find((d) => d.id === dishId);
            if (dish) {
              menu.days[day].push({
                ...dish,
                category: type as "desayuno" | "almuerzo" | "cafe" | "cena",
              });
            }
          }
        }
      }

      await this.db.predefinedMenus.add(menu);
      await this.loadMenus();
      this.cancelForm();
      
      // Show success message
      this.showSuccessMessage(`Menú "${menu.name}" guardado exitosamente`);
    } catch (error) {
      console.error('Error saving menu:', error);
      alert('Error al guardar el menú. Inténtalo de nuevo.');
    }
  }

  async deleteMenu(id: string): Promise<void> {
    if (!confirm('¿Estás seguro de que quieres eliminar este menú predefinido?')) {
      return;
    }

    try {
      await this.db.predefinedMenus.delete(id);
      await this.loadMenus();
      this.showSuccessMessage('Menú eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting menu:', error);
      alert('Error al eliminar el menú. Inténtalo de nuevo.');
    }
  }

  async useMenu(menu: PredefinedMenu): Promise<void> {
    if (!confirm(`¿Quieres reemplazar el menú de la semana actual con "${menu.name}"?`)) {
      return;
    }

    try {
      await this.menuService.replaceCurrentWeekMenu(menu.days);
      this.showSuccessMessage(`Menú "${menu.name}" aplicado a la semana actual`);
      
      // Emit event to notify other components
      window.dispatchEvent(new CustomEvent('menuUpdated'));
    } catch (error) {
      console.error('Error applying menu:', error);
      alert('Error al aplicar el menú. Inténtalo de nuevo.');
    }
  }

  cancelForm(): void {
    this.showAddForm.set(false);
    this.newMenuName = "";
    this.initializeNewMenuDays();
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private showSuccessMessage(message: string): void {
    // Create a temporary success notification
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
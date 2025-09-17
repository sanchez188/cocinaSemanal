import { Component, OnInit, inject, signal, effect } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MenuService } from "../services/menu.service";
import { DishesService } from "../services/dishes.service";
import { WeeklyMenu, Dish } from "../models/interfaces";

@Component({
  selector: "app-weekly-menu",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">Menú Semanal</h2>
        <p class="text-gray-600">Organiza tus comidas para toda la semana</p>
        @if (currentWeek()) {
          <p class="text-sm text-gray-500 mt-1">
            Semana del {{ formatWeekDate(currentWeek()!) }}
          </p>
        }
      </div>

      @if (currentMenu(); as menu) {
        <div class="grid gap-6">
          @for (day of days; track day) {
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3">
                <h3 class="font-semibold capitalize">{{ day }}</h3>
              </div>

              <div class="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                @for (meal of meals; track meal) {
                  <div class="meal-section">
                    <h4 class="text-sm font-medium text-gray-700 mb-2 capitalize">
                      {{ meal }}
                    </h4>

                    <div class="space-y-2 mb-3">
                      @for (dishId of getMealDishes(day, meal); track dishId; let i = $index) {
                        <div
                          [class]="getWarning(day, meal, dishId) 
                            ? 'bg-yellow-100 border border-yellow-400' 
                            : 'bg-gray-50'"
                          class="flex items-center justify-between p-2 rounded text-sm transition-colors"
                        >
                          <span class="flex-1">
                            {{ getDishName(dishId) }}
                            @if (getWarning(day, meal, dishId); as warning) {
                              <div class="mt-1">
                                <span class="inline-block px-2 py-1 text-xs rounded bg-yellow-400 text-yellow-900 font-semibold">
                                  ⚠ Faltante: {{ warning.join(", ") }}
                                </span>
                              </div>
                            }
                          </span>
                          <button
                            (click)="removeDish(day, meal, dishId)"
                            class="text-red-500 hover:text-red-700 ml-2 p-1 hover:bg-red-50 rounded transition-colors"
                            title="Eliminar platillo"
                          >
                            ✕
                          </button>
                        </div>
                      }
                    </div>

                    <div class="flex space-x-2">
                      <select
                        [(ngModel)]="selectedDishes()[day + '-' + meal]"
                        class="flex-1 text-xs px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Seleccionar platillo</option>
                        @for (dish of getDishesByCategory(meal); track dish.id) {
                          <option [value]="dish.id">
                            {{ dish.name }}
                          </option>
                        }
                      </select>
                      <button
                        (click)="addDish(day, meal)"
                        [disabled]="!selectedDishes()[day + '-' + meal]"
                        class="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="text-center py-12">
          <div class="text-gray-400 text-6xl mb-4">📅</div>
          <h3 class="text-xl font-semibold text-gray-700 mb-2">
            Cargando menú semanal...
          </h3>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .meal-section {
        min-height: 120px;
      }
    `,
  ],
})
export class WeeklyMenuComponent implements OnInit {
  private menuService = inject(MenuService);
  private dishesService = inject(DishesService);

  currentMenu = signal<WeeklyMenu | null>(null);
  currentWeek = signal<string | null>(null);
  dishes = signal<Dish[]>([]);
  selectedDishes = signal<{ [key: string]: string }>({});

  days = [
    "lunes",
    "martes",
    "miercoles",
    "jueves",
    "viernes",
    "sabado",
    "domingo",
  ];
  meals = ["desayuno", "almuerzo", "cafe", "cena"];

  constructor() {
    // Listen for menu updates from predefined menus
    window.addEventListener('menuUpdated', () => {
      this.loadCurrentMenu();
    });

    // Effect to update current week when menu changes
    effect(() => {
      const menu = this.currentMenu();
      if (menu) {
        this.currentWeek.set(menu.week);
      }
    });
  }

  ngOnInit(): void {
    this.loadCurrentMenu();
    this.loadDishes();
  }

  private async loadCurrentMenu(): Promise<void> {
    this.menuService.currentMenu$.subscribe(menu => {
      this.currentMenu.set(menu);
    });
  }

  private async loadDishes(): Promise<void> {
    this.dishesService.dishes$.subscribe(dishes => {
      this.dishes.set(dishes);
    });
  }

  getWarning(day: string, meal: string, dishId: string): string[] | null {
    const menu = this.currentMenu();
    if (!menu || !menu.warnings) return null;
    
    const dayWarnings = menu.warnings[day];
    if (!dayWarnings) return null;
    
    const mealWarnings = dayWarnings[meal];
    if (!mealWarnings) return null;
    
    return mealWarnings[dishId] || null;
  }

  getMealDishes(day: string, meal: string): string[] {
    const menu = this.currentMenu();
    if (!menu || !menu.meals[day]) return [];
    
    return menu.meals[day][meal as keyof WeeklyMenu["meals"][string]] || [];
  }

  getDishName(dishId: string): string {
    const dish = this.dishes().find((d) => d.id === dishId);
    return dish ? dish.name : "Platillo desconocido";
  }

  getDishesByCategory(meal: string): Dish[] {
    return this.dishes().filter((dish) => dish.category === meal);
  }

  async addDish(day: string, meal: string): Promise<void> {
    const selectedDishId = this.selectedDishes()[day + "-" + meal];
    if (selectedDishId) {
      const result = await this.menuService.addDishToMenu(day, meal, selectedDishId);
      
      if (result.warning) {
        this.showWarningMessage(
          `Advertencia: Faltan ingredientes para "${this.getDishName(selectedDishId)}": ${result.missingIngredients.join(", ")}`
        );
      }
      
      // Clear selection
      const newSelections = { ...this.selectedDishes() };
      newSelections[day + "-" + meal] = "";
      this.selectedDishes.set(newSelections);
    }
  }

  async removeDish(day: string, meal: string, dishId: string): Promise<void> {
    await this.menuService.removeDishFromMenu(day, meal, dishId);
  }

  formatWeekDate(week: string): string {
    const date = new Date(week);
    const endDate = new Date(date);
    endDate.setDate(date.getDate() + 6);
    
    return `${date.toLocaleDateString('es-ES')} - ${endDate.toLocaleDateString('es-ES')}`;
  }

  private showWarningMessage(message: string): void {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 5000);
  }
}
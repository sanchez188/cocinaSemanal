import { Component, OnInit, inject, signal, effect } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MenuService } from "../services/menu.service";
import { weeklyMenuChanged$ } from "./menus-predefinidos.component";
import { DishesService } from "../services/dishes.service";
import { WeeklyMenu, Dish, DAYS_OF_WEEK } from "../models/interfaces";

@Component({
  selector: "app-weekly-menu",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">Menú Semanal</h2>
        <p class="text-gray-600">Organiza tus comidas para toda la semana</p>
        <p *ngIf="currentWeek()" class="text-sm text-gray-500 mt-1">
          Semana del {{ formatWeekDate(currentWeek()!) }}
        </p>
      </div>

      <div *ngIf="currentMenu()" class="grid gap-6">
        <div
          *ngFor="let day of days"
          class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
        >
          <div
            class="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3"
          >
            <h3 class="font-semibold capitalize">{{ day }}</h3>
          </div>
          <div class="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div *ngFor="let meal of meals" class="meal-section">
              <h4 class="text-sm font-medium text-gray-700 mb-2 capitalize">
                {{ meal }}
              </h4>
              <div class="space-y-2 mb-3">
                <div
                  *ngFor="
                    let dishId of getMealDishes(day, meal);
                    trackBy: trackByDishId
                  "
                  [ngClass]="
                    getWarning(day, meal, dishId)
                      ? 'bg-yellow-100 border border-yellow-400'
                      : 'bg-gray-50'
                  "
                  class="flex items-center justify-between p-2 rounded text-sm"
                >
                  <span>
                    {{ getDishName(dishId) }}
                    <span
                      *ngIf="getWarning(day, meal, dishId)"
                      class="ml-2 px-2 py-1 text-xs rounded bg-yellow-400 text-yellow-900 font-semibold"
                    >
                      ⚠ Ingrediente/s faltante:
                      {{ getWarning(day, meal, dishId)?.join(", ") }}
                    </span>
                  </span>
                  <button
                    (click)="removeDish(day, meal, dishId)"
                    class="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div class="flex space-x-2">
                <select
                  [ngModel]="selectedDishes[day + '-' + meal]"
                  (ngModelChange)="selectedDishes[day + '-' + meal] = $event"
                  class="flex-1 text-xs px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar platillo</option>
                  <option
                    *ngFor="let dish of getDishesByCategory(meal)"
                    [value]="dish.id"
                  >
                    {{ dish.name }}
                  </option>
                </select>
                <button
                  (click)="addDish(day, meal)"
                  [disabled]="!selectedDishes[day + '-' + meal]"
                  class="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div *ngIf="!currentMenu()" class="text-center py-12">
        <div class="text-gray-400 text-6xl mb-4">📅</div>
        <h3 class="text-xl font-semibold text-gray-700 mb-2">
          Cargando menú semanal...
        </h3>
      </div>
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
  trackByDishId(index: number, dishId: string) {
    return dishId;
  }
  /**
   * Devuelve array de ingredientes faltantes si hay advertencia para ese platillo, si no null.
   */

  menuService = inject(MenuService);
  dishesService = inject(DishesService);
  days = DAYS_OF_WEEK;
  meals = ["desayuno", "almuerzo", "cafe", "cena"];
  currentMenu = signal<WeeklyMenu | null>(null);
  dishes = signal<Dish[]>([]);
  selectedDishes: { [key: string]: string } = {};
  currentWeek = signal<string>("");

  constructor() {
    window.addEventListener("menuUpdated", () => {
      this.currentMenu.set(this.menuService.currentMenu());
    });
    effect(() => {
      const menu = this.currentMenu();
      if (menu) {
        this.currentWeek.set(menu.week);
      }
    });
  }

  async ngOnInit(): Promise<void> {
    const menu = this.menuService.currentMenu();
    this.currentMenu.set(menu);
    if (menu) {
      this.selectedDishes = {};
      for (const day of this.days) {
        for (const meal of this.meals) {
          const dish = menu.days[day]?.find((d: Dish) => d.category === meal);
          this.selectedDishes[day + "-" + meal] = dish ? dish.id : "";
        }
      }
    }
    this.dishes.set(this.dishesService.dishes());
    weeklyMenuChanged$.subscribe(async (week: string) => {
      await this.menuService.loadWeekMenu(week);
      this.currentMenu.set(this.menuService.currentMenu());
    });
  }

  // Si necesitas actualizar los platillos desde un observable, implementa aquí

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
    if (!menu || !menu.days[day]) return [];
    return menu.days[day]
      .filter((dish: Dish) => dish.category === meal)
      .map((dish: Dish) => dish.id);
  }

  getDishName(dishId: string): string {
    const dish = this.dishes().find((d: Dish) => d.id === dishId);
    return dish ? dish.name : "Platillo desconocido";
  }

  getDishesByCategory(meal: string): Dish[] {
    return this.dishes().filter((dish: Dish) => dish.category === meal);
  }

  async addDish(day: string, meal: string): Promise<void> {
    const selectedDishId = this.selectedDishes[day + "-" + meal];
    if (selectedDishId) {
      await this.menuService.addDishToMenu(day, meal, selectedDishId);
      this.selectedDishes[day + "-" + meal] = "";
      this.currentMenu.set(this.menuService.currentMenu());
    }
  }

  async removeDish(day: string, meal: string, dishId: string): Promise<void> {
    await this.menuService.removeDishFromMenu(day, meal, dishId);
    this.currentMenu.set(this.menuService.currentMenu());
  }

  formatWeekDate(week: string): string {
    const date = new Date(week);
    const endDate = new Date(date);
    endDate.setDate(date.getDate() + 6);

    return `${date.toLocaleDateString("es-ES")} - ${endDate.toLocaleDateString(
      "es-ES"
    )}`;
  }

  private showWarningMessage(message: string): void {
    const notification = document.createElement("div");
    notification.className =
      "fixed top-4 right-4 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300";
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 5000);
  }
}

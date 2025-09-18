import { Component, OnInit } from "@angular/core";
import { signal } from "@angular/core";
import { Subject } from "rxjs";
import { PredefinedMenuService } from "../services/predefined-menu.service";
import { WeeklyMenuService } from "../services/weekly-menu.service";
import { MenuService } from "../services/menu.service";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Dish, DAYS_OF_WEEK } from "../models/interfaces";
import { DishesService } from "../services/dishes.service";
import { startOfWeek } from "date-fns";
import { es } from "date-fns/locale";

export const weeklyMenuChanged$ = new Subject<string>();
interface PredefinedMenuWeek {
  id: string;
  name: string;
  days: {
    [day: string]: Dish[];
  };
}

@Component({
  selector: "app-menus-predefinidos",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-4">Menús Semanales Predefinidos</h2>
      <div class="mb-6">
        <button
          (click)="showAddForm.set(!showAddForm())"
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          {{ showAddForm() ? "Cancelar" : "+ Nuevo Menú Predefinido" }}
        </button>
      </div>
      @if (showAddForm()) {
      <div class="mb-6 bg-white rounded-lg shadow-sm border p-6">
        <h3 class="text-lg font-semibold mb-4">
          {{
            editingMenu ? "Editar Menú Predefinido" : "Nuevo Menú Predefinido"
          }}
        </h3>
        <input
          type="text"
          [(ngModel)]="newMenuName"
          placeholder="Nombre del menú (ej: Semana 1)"
          class="w-full mb-4 px-3 py-2 border rounded"
        />
        @for (day of daysOfWeek; track day) {
        <div class="mb-6">
          <label class="block font-medium mb-2 text-lg">{{ day }}</label>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (type of mealTypes; track type) {
            <div>
              <label class="block text-sm mb-1">{{ type | titlecase }}</label>
              <select
                [(ngModel)]="newMenuDays()[day][type]"
                class="w-full px-3 py-2 border rounded"
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
        <div class="flex gap-2 mt-4">
          <button
            (click)="editingMenu ? saveEditMenu() : saveNewMenu()"
            [disabled]="!newMenuName.trim()"
            class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ editingMenu ? "Guardar Cambios" : "Guardar Menú" }}
          </button>
          <button
            (click)="cancelForm()"
            class="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Cancelar
          </button>
        </div>
      </div>
      } @if (predefinedMenus().length === 0) {
      <div class="text-center py-12">
        <div class="text-gray-400 text-6xl mb-4">📋</div>
        <h3 class="text-xl font-semibold text-gray-700 mb-2">
          No hay menús predefinidos
        </h3>
        <p class="text-gray-500">
          Crea tu primer menú predefinido para reutilizarlo
        </p>
      </div>
      } @for (menu of predefinedMenus(); track menu.id) { @if (!editingMenu ||
      editingMenu.id !== menu.id) {
      <div class="mb-4 p-4 border rounded-lg bg-gray-50">
        <div class="flex justify-between items-center mb-2">
          <span class="font-semibold">{{ menu.name }}</span>
          <div>
            <button
              (click)="editMenu(menu)"
              class="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 mr-2"
            >
              Editar
            </button>
            <button
              (click)="useMenu(menu)"
              class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
            >
              Usar este menú
            </button>
            <button
              (click)="deleteMenu(menu.id)"
              class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Eliminar
            </button>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2 mt-2">
          @for (day of daysOfWeek; track day) {
          <div>
            <span class="font-medium">{{ day }}:</span>
            <span>
              @for (dish of menu.days[day]; track dish.id) {
              {{ dish.name
              }}<span *ngIf="dish.category"> ({{ dish.category }})</span
              ><span *ngIf="!isLastDish(menu.days[day], dish)">, </span>
              }
            </span>
          </div>
          }
        </div>
      </div>
      } }
    </div>
  `,
})
export class MenusPredefinidosComponent implements OnInit {
  isLastDish(dishes: Dish[], dish: Dish): boolean {
    return dishes[dishes.length - 1]?.id === dish.id;
  }
  dishesFilteredByType(type: string): Dish[] {
    return this.dishes().filter((d: Dish) => d.category === type);
  }

  cancelForm() {
    this.editingMenu = null;
    this.showAddForm.set(false);
    this.newMenuName = "";
    // Reiniciar estructura para selects
    const daysObjReset: {
      [day: string]: { [type: string]: string | undefined };
    } = {};
    for (const day of this.daysOfWeek) {
      daysObjReset[day] = {};
      for (const type of this.mealTypes) {
        daysObjReset[day][type] = undefined;
      }
    }
    this.newMenuDays.set(daysObjReset);
  }
  editingMenu: PredefinedMenuWeek | null = null;
  predefinedMenus = signal<PredefinedMenuWeek[]>([]);
  dishes = signal<Dish[]>([]);
  showAddForm = signal(false);
  newMenuName = "";
  newMenuDays = signal<{
    [day: string]: { [type: string]: string | undefined };
  }>({});
  mealTypes = ["desayuno", "almuerzo", "cafe", "cena"];
  daysOfWeek = DAYS_OF_WEEK;

  editMenu(menu: PredefinedMenuWeek) {
    this.editingMenu = menu;
    this.showAddForm.set(true);
    this.newMenuName = menu.name;
    const daysObj: { [day: string]: { [type: string]: string | undefined } } =
      {};
    for (const day of this.daysOfWeek) {
      daysObj[day] = {};
      for (const type of this.mealTypes) {
        const dish = menu.days[day]?.find((d) => d.category === type);
        daysObj[day][type] = dish ? dish.id : undefined;
      }
    }
    this.newMenuDays.set(daysObj);
  }

  async saveEditMenu() {
    if (!this.editingMenu) return;
    if (!this.newMenuName.trim()) return;
    const menu: PredefinedMenuWeek = {
      id: this.editingMenu.id,
      name: this.newMenuName.trim(),
      days: {},
    };
    const daysObj = this.newMenuDays();
    for (const day of this.daysOfWeek) {
      menu.days[day] = [];
      for (const type of this.mealTypes) {
        const dishId = daysObj[day][type];
        if (dishId) {
          const dish = this.dishes().find((d) => d.id === dishId);
          if (dish) {
            await this.dishesService.addDish(dish);
            menu.days[day].push({
              ...dish,
              category: type as "desayuno" | "almuerzo" | "cena" | "cafe",
            });
          }
        }
      }
    }
    await this.predefinedMenuService.saveMenu(menu);
    this.predefinedMenus.set(await this.predefinedMenuService.getAllMenus());
    this.showAddForm.set(false);
    this.editingMenu = null;
    this.newMenuName = "";
    this.newMenuDays.set({});
  }

  cancelEdit() {
    this.editingMenu = null;
    this.showAddForm.set(false);
    this.newMenuName = "";
    this.newMenuDays.set({});
  }
  constructor(
    private predefinedMenuService: PredefinedMenuService,
    private weeklyMenuService: WeeklyMenuService,
    private menuService: MenuService,
    private dishesService: DishesService
  ) {}

  async ngOnInit() {
    await this.migrateLocalStorageMenus();
    this.predefinedMenus.set(await this.predefinedMenuService.getAllMenus());
    this.dishes.set(await this.dishesService.getDishes());
    // Inicializar estructura para los selects
    const daysObj: { [day: string]: { [type: string]: string | undefined } } =
      {};
    for (const day of this.daysOfWeek) {
      daysObj[day] = {};
      for (const type of this.mealTypes) {
        daysObj[day][type] = undefined;
      }
    }
    this.newMenuDays.set(daysObj);
  }

  async migrateLocalStorageMenus() {
    const data = localStorage.getItem("predefinedMenus");
    if (data) {
      const menus = JSON.parse(data);
      for (const menu of menus) {
        await this.predefinedMenuService.saveMenu(menu);
      }
      localStorage.removeItem("predefinedMenus");
    }
  }

  async loadMenus() {
    this.predefinedMenus.set(await this.predefinedMenuService.getAllMenus());
  }

  async saveNewMenu() {
    if (!this.newMenuName.trim()) return;
    const menu: PredefinedMenuWeek = {
      id: "menu-" + Date.now(),
      name: this.newMenuName.trim(),
      days: {},
    };
    const daysObj = this.newMenuDays();
    for (const day of this.daysOfWeek) {
      menu.days[day] = [];
      for (const type of this.mealTypes) {
        const dishId = daysObj[day][type];
        if (dishId) {
          const dish = this.dishes().find((d) => d.id === dishId);
          if (dish) {
            await this.dishesService.addDish(dish);
            menu.days[day].push({
              ...dish,
              category: type as "desayuno" | "almuerzo" | "cena" | "cafe",
            });
          }
        }
      }
    }
    await this.predefinedMenuService.saveMenu(menu);
    this.predefinedMenus.set(await this.predefinedMenuService.getAllMenus());
    this.showAddForm.set(false);
    this.newMenuName = "";
    // Reiniciar estructura para selects
    const daysObjReset: {
      [day: string]: { [type: string]: string | undefined };
    } = {};
    for (const day of this.daysOfWeek) {
      daysObjReset[day] = {};
      for (const type of this.mealTypes) {
        daysObjReset[day][type] = undefined;
      }
    }
    this.newMenuDays.set(daysObjReset);
  }

  async deleteMenu(id: string) {
    await this.predefinedMenuService.deleteMenu(id);
    this.predefinedMenus.set(await this.predefinedMenuService.getAllMenus());
  }

  async useMenu(menu: PredefinedMenuWeek) {
    // Calcular el primer día (lunes) de la semana actual usando date-fns
    const monday = startOfWeek(new Date(), { weekStartsOn: 1, locale: es });
    const dateStr = monday.toISOString().split("T")[0];
    const key = `menu-${dateStr}`;
    let weeklyMenu = await this.weeklyMenuService.getMenu(key);
    let menuObj;
    if (weeklyMenu) {
      menuObj = weeklyMenu;
      menuObj.week = dateStr; // Asegurar que la semana es lunes
    } else {
      menuObj = { id: key, week: dateStr, days: {} };
    }
    // Normalizar los días al copiar
    menuObj.days = {};
    for (const day of DAYS_OF_WEEK) {
      // Buscar el día en el menú predefinido (ignorando mayúsculas/acentos)
      const match = Object.keys(menu.days).find(
        (d) =>
          d
            .toLowerCase()
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "") === day
      );
      menuObj.days[day] = match ? menu.days[match] : [];
    }
    // Restaurar inventario según el menú anterior de la semana
    const previousMenu = await this.menuService.getMenuForWeek(dateStr);
    if (previousMenu) {
      // Sumar ingredientes usados en el menú anterior
      await this.menuService.inventoryServicePublic.recalculateInventoryFromMenu(
        { days: {} }
      ); // Primero restaurar todo
      await this.menuService.inventoryServicePublic.batchAddIngredientsFromMenu(
        previousMenu
      );
    }
    // Guardar el nuevo menú
    await this.weeklyMenuService.saveMenu(menuObj);
    await this.menuService.loadWeekMenu(dateStr);
    // Forzar actualización en WeeklyMenuComponent, pasando la semana seleccionada
    window.dispatchEvent(
      new CustomEvent("menuUpdated", { detail: { week: dateStr } })
    );
    // Recalcular inventario según el menú copiado
    await this.menuService.inventoryServicePublic.recalculateInventoryFromMenu(
      menuObj
    );
    weeklyMenuChanged$.next(dateStr);
    // Mostrar diálogo estilizado con Tailwind
    const dialog = document.createElement("div");
    dialog.className =
      "fixed top-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 text-lg font-semibold transition-all duration-300";
    dialog.textContent = `Menú \"${menu.name}\" copiado para la semana actual.`;
    document.body.appendChild(dialog);
    setTimeout(() => {
      dialog.style.opacity = "0";
      setTimeout(() => {
        document.body.removeChild(dialog);
      }, 300);
    }, 3000);
  }
}

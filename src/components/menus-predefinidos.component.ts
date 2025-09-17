import { Component, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { PredefinedMenuService } from "../services/predefined-menu.service";
import { WeeklyMenuService } from "../services/weekly-menu.service";
import { MenuService } from "../services/menu.service";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Dish, DAYS_OF_WEEK } from "../models/interfaces";
import { DishesService } from "../services/dishes.service";

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
      <div
        *ngIf="showAddForm"
        class="mb-6 bg-white rounded-lg shadow-sm border p-6"
      >
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
                [(ngModel)]="newMenuDays[day][type]"
                class="w-full px-3 py-2 border rounded"
              >
                <option [ngValue]="undefined">-- Sin platillo --</option>
                @for (dish of dishesFilteredByType(type); track dish.id) {
                <option [ngValue]="dish.id">{{ dish.name }}</option>
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
        <button
          (click)="editingMenu ? saveEditMenu() : saveNewMenu()"
          class="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          {{ editingMenu ? "Guardar Cambios" : "Guardar Menú" }}
        </button>
        <button
          *ngIf="editingMenu"
          (click)="cancelEdit()"
          class="mt-4 ml-2 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
        >
          Cancelar
        </button>
      </div>
      <div
        *ngFor="let menu of predefinedMenus"
        class="mb-4 p-4 border rounded-lg bg-gray-50"
      >
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
        }
      </div>
    </div>
  `,
})
export class MenusPredefinidosComponent implements OnInit {
  editingMenu: PredefinedMenuWeek | null = null;
  editMenu(menu: PredefinedMenuWeek) {
    this.editingMenu = menu;
    this.showAddForm = true;
    this.newMenuName = menu.name;
    for (const day of this.daysOfWeek) {
      this.newMenuDays[day] = {};
      for (const type of this.mealTypes) {
        const dish = menu.days[day]?.find((d) => d.category === type);
        this.newMenuDays[day][type] = dish ? dish.id : undefined;
      }
    }
  }

  async saveEditMenu() {
    if (!this.editingMenu) return;
    if (!this.newMenuName.trim()) return;
    const menu: PredefinedMenuWeek = {
      id: this.editingMenu.id,
      name: this.newMenuName.trim(),
      days: {},
    };
    for (const day of this.daysOfWeek) {
      menu.days[day] = [];
      for (const type of this.mealTypes) {
        const dishId = this.newMenuDays[day][type];
        if (dishId) {
          const dish = this.dishes.find((d) => d.id === dishId);
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
    this.predefinedMenus = await this.predefinedMenuService.getAllMenus();
    this.showAddForm = false;
    this.editingMenu = null;
    this.newMenuName = "";
    this.newMenuDays = {};
  }

  cancelEdit() {
    this.editingMenu = null;
    this.showAddForm = false;
    this.newMenuName = "";
    this.newMenuDays = {};
  }
  constructor(
    private predefinedMenuService: PredefinedMenuService,
    private weeklyMenuService: WeeklyMenuService,
    private menuService: MenuService,
    private dishesService: DishesService
  ) {}
  predefinedMenus: PredefinedMenuWeek[] = [];
  showAddForm = false;
  newMenuName = "";
  newMenuDays: { [day: string]: { [type: string]: string | undefined } } = {};
  mealTypes = ["desayuno", "almuerzo", "cena", "cafe"];
  daysOfWeek = DAYS_OF_WEEK;
  dishes: Dish[] = [];

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

  async ngOnInit() {
    await this.migrateLocalStorageMenus();
    this.predefinedMenus = await this.predefinedMenuService.getAllMenus();
    // Usar signal para los platillos
    this.dishes = this.dishesService.dishes();
    // Inicializar estructura para los selects
    for (const day of this.daysOfWeek) {
      if (!this.newMenuDays[day]) {
        this.newMenuDays[day] = {};
      }
      for (const type of this.mealTypes) {
        if (!this.newMenuDays[day][type]) {
          this.newMenuDays[day][type] = undefined;
        }
      }
    }
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
    this.predefinedMenus = await this.predefinedMenuService.getAllMenus();
  }

  async saveNewMenu() {
    if (!this.newMenuName.trim()) return;
    const menu: PredefinedMenuWeek = {
      id: "menu-" + Date.now(),
      name: this.newMenuName.trim(),
      days: {},
    };
    for (const day of this.daysOfWeek) {
      menu.days[day] = [];
      for (const type of this.mealTypes) {
        const dishId = this.newMenuDays[day][type];
        if (dishId) {
          const dish = this.dishes.find((d) => d.id === dishId);
          if (dish) {
            // Guardar/actualizar el platillo en Dexie
            await this.dishesService.addDish(dish);
            menu.days[day].push({
              ...dish,
              category: type as "desayuno" | "almuerzo" | "cena" | "cafe",
            });
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
    await this.predefinedMenuService.saveMenu(menu);
    this.predefinedMenus = await this.predefinedMenuService.getAllMenus();
    this.showAddForm = false;
    this.newMenuName = "";
    this.initializeNewMenuDays();
  }

  async deleteMenu(id: string) {
    await this.predefinedMenuService.deleteMenu(id);
    this.predefinedMenus = await this.predefinedMenuService.getAllMenus();
  }

  async useMenu(menu: PredefinedMenuWeek) {
    // Calcular el primer día (lunes) de la semana actual
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=domingo, 1=lunes, ...
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - diff);
    const yyyy = monday.getFullYear();
    const mm = String(monday.getMonth() + 1).padStart(2, "0");
    const dd = String(monday.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const key = `menu-${dateStr}`;
    let weeklyMenu = await this.weeklyMenuService.getMenu(key);
    let menuObj;
    if (weeklyMenu) {
      menuObj = weeklyMenu;
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
    await this.weeklyMenuService.saveMenu(menuObj);
    await this.menuService.loadWeekMenu(dateStr);
    // Recalcular inventario según el menú copiado
    this.menuService.inventoryServicePublic.recalculateInventoryFromMenu(
      menuObj
    );
    weeklyMenuChanged$.next(dateStr);
    alert(`Menú "${menu.name}" copiado para la semana actual.`);
  }
}
import { Component, OnInit } from "@angular/core";
import { StorageService } from "../services/storage.service";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Dish } from "../models/interfaces";

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
          (click)="showAddForm = !showAddForm"
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          {{ showAddForm ? "Cancelar" : "+ Nuevo Menú Predefinido" }}
        </button>
      </div>
      <div
        *ngIf="showAddForm"
        class="mb-6 bg-white rounded-lg shadow-sm border p-6"
      >
        <h3 class="text-lg font-semibold mb-4">Nuevo Menú Predefinido</h3>
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
              </select>
            </div>
            }
          </div>
        </div>
        }
        <button
          (click)="saveNewMenu()"
          class="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          Guardar Menú
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
        <div class="grid grid-cols-2 gap-2">
          <div *ngFor="let day of daysOfWeek">
            <span class="font-medium">{{ day }}:</span>
            <span>
              <ng-container *ngFor="let dish of menu.days[day]">
                {{ dish.name
                }}<span *ngIf="dish.category"> ({{ dish.category }})</span
                ><span *ngIf="!isLastDish(menu.days[day], dish)">, </span>
              </ng-container>
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class MenusPredefinidosComponent implements OnInit {
  constructor(private storageService: StorageService) {}
  predefinedMenus: PredefinedMenuWeek[] = [];
  showAddForm = false;
  newMenuName = "";
  newMenuDays: { [day: string]: { [type: string]: string | undefined } } = {};
  mealTypes = ["desayuno", "almuerzo", "cena", "cafe"];
  daysOfWeek = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];
  dishes: Dish[] = [];

  dishesFilteredByType(type: string): Dish[] {
    if (!type) return this.dishes;
    return this.dishes.filter((d) => d.category === type);
  }

  ngOnInit(): void {
    this.loadMenus();
    this.dishes = JSON.parse(
      localStorage.getItem("meal-planner-dishes") || "[]"
    );
    debugger;
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

  loadMenus() {
    const data = localStorage.getItem("predefinedMenus");
    this.predefinedMenus = data ? JSON.parse(data) : [];
  }

  saveMenus() {
    localStorage.setItem(
      "predefinedMenus",
      JSON.stringify(this.predefinedMenus)
    );
  }

  saveNewMenu() {
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
          if (dish)
            menu.days[day].push({
              ...dish,
              category: type as "desayuno" | "almuerzo" | "cena" | "cafe",
            });
        }
      }
    }
    this.predefinedMenus.push(menu);
    this.saveMenus();
    this.showAddForm = false;
    this.newMenuName = "";
    this.newMenuDays = {};
  }

  deleteMenu(id: string) {
    this.predefinedMenus = this.predefinedMenus.filter((m) => m.id !== id);
    this.saveMenus();
  }

  useMenu(menu: PredefinedMenuWeek) {
    // Calcular el primer día (lunes) de la semana actual
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=domingo, 1=lunes, ...
    // Si es domingo, retroceder 6 días; si es lunes, retroceder 0 días, etc.
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - diff);
    const yyyy = monday.getFullYear();
    const mm = String(monday.getMonth() + 1).padStart(2, "0");
    const dd = String(monday.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    // Buscar el menú semanal actual por key o id
    const key = `menu-${dateStr}`;
    let weeklyMenu = this.storageService.getItem<any>(key);
    let menuObj;
    if (weeklyMenu) {
      menuObj = weeklyMenu;
    } else {
      // Si no existe, crear uno nuevo
      menuObj = { id: key, days: {} };
    }

    // Reemplazar los platillos (days)
    menuObj.days = menu.days;
    // Guardar usando StorageService con el key correcto
    this.storageService.setItem(key, menuObj);
    window.dispatchEvent(new Event("weeklyMenuUpdated"));
    alert(`Menú "${menu.name}" copiado para la semana actual.`);
  }

  isLastDish(dishes: Dish[], dish: Dish): boolean {
    return dishes[dishes.length - 1] === dish;
  }
}

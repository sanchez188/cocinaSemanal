import { Component, OnInit, isDevMode } from "@angular/core";
import { CommonModule } from "@angular/common";
import { bootstrapApplication } from "@angular/platform-browser";
import { HeaderComponent } from "./components/header.component";
import { NavigationComponent } from "./components/navigation.component";
import { WeeklyMenuComponent } from "./components/weekly-menu.component";
import { DishesManagementComponent } from "./components/dishes-management.component";
import { ShoppingListComponent } from "./components/shopping-list.component";
import { HistoryComponent } from "./components/history.component";
import { InventoryService } from "./services/inventory.service";
import { DishesService } from "./services/dishes.service";
import { InventoryManagementComponent } from "./components/inventory-management.component";
import { provideServiceWorker } from "@angular/service-worker";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    NavigationComponent,
    WeeklyMenuComponent,
    DishesManagementComponent,
    InventoryManagementComponent,
    ShoppingListComponent,
    HistoryComponent,
  ],
  template: `
    <div class="min-h-screen bg-gray-50">
      <app-header></app-header>
      <app-navigation
        [activeTab]="activeTab"
        (tabChange)="onTabChange($event)"
      ></app-navigation>

      <main class="container mx-auto max-w-7xl">
        <app-weekly-menu *ngIf="activeTab === 'menu'"></app-weekly-menu>
        <app-dishes-management
          *ngIf="activeTab === 'dishes'"
        ></app-dishes-management>
        <app-inventory-management
          *ngIf="activeTab === 'inventory'"
        ></app-inventory-management>
        <app-shopping-list *ngIf="activeTab === 'shopping'"></app-shopping-list>
        <app-history *ngIf="activeTab === 'history'"></app-history>
      </main>
    </div>
  `,
})
export class App implements OnInit {
  activeTab = "menu";

  constructor(
    private inventoryService: InventoryService,
    private dishesService: DishesService
  ) {}

  ngOnInit(): void {
    this.initializeSampleData();
  }

  onTabChange(tab: string): void {
    this.activeTab = tab;
  }

  private initializeSampleData(): void {
    // Check if we already have data
    const existingInventory = this.inventoryService.getInventory();
    const existingDishes = this.dishesService.getDishes();

    if (existingInventory.length === 0) {
      // Add sample ingredients
      const sampleIngredients = [
        {
          id: "huevos-001",
          name: "Huevos",
          quantity: 30,
          unit: "unidades",
          pricePerUnit: 0.25,
          category: "lacteos",
        },
        {
          id: "arroz-001",
          name: "Arroz",
          quantity: 2,
          unit: "kg",
          pricePerUnit: 1.5,
          category: "cereales",
        },
        {
          id: "pollo-001",
          name: "Pechuga de Pollo",
          quantity: 1.5,
          unit: "kg",
          pricePerUnit: 4.5,
          category: "carnes",
        },
        {
          id: "tomate-001",
          name: "Tomate",
          quantity: 1,
          unit: "kg",
          pricePerUnit: 2.0,
          category: "verduras",
        },
        {
          id: "cebolla-001",
          name: "Cebolla",
          quantity: 0.5,
          unit: "kg",
          pricePerUnit: 1.2,
          category: "verduras",
        },
        {
          id: "aceite-001",
          name: "Aceite de Cocina",
          quantity: 1,
          unit: "l",
          pricePerUnit: 2.8,
          category: "otros",
        },
      ];

      sampleIngredients.forEach((ingredient) => {
        this.inventoryService.addIngredient(ingredient);
      });
    }

    if (existingDishes.length === 0) {
      // Add sample dishes
      const sampleDishes = [
        {
          id: "dish-001",
          name: "Huevos Revueltos",
          category: "desayuno" as const,
          servings: 2,
          ingredients: [
            { ingredientId: "huevos-001", quantity: 3 },
            { ingredientId: "aceite-001", quantity: 0.01 },
          ],
        },
        {
          id: "dish-002",
          name: "Arroz con Pollo",
          category: "almuerzo" as const,
          servings: 4,
          ingredients: [
            { ingredientId: "arroz-001", quantity: 0.25 },
            { ingredientId: "pollo-001", quantity: 0.4 },
            { ingredientId: "tomate-001", quantity: 0.2 },
            { ingredientId: "cebolla-001", quantity: 0.1 },
            { ingredientId: "aceite-001", quantity: 0.02 },
          ],
        },
      ];

      sampleDishes.forEach((dish) => {
        this.dishesService.addDish(dish);
      });
    }
  }
}

bootstrapApplication(App, {
  providers: [
    provideServiceWorker("ngsw-worker.js", {
      enabled: !isDevMode(),
      registrationStrategy: "registerWhenStable:30000",
    }),
    provideServiceWorker("ngsw-worker.js", {
      enabled: !isDevMode(),
      registrationStrategy: "registerWhenStable:30000",
    }),
  ],
});

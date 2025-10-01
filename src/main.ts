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
import { MenusPredefinidosComponent } from "./components/menus-predefinidos.component";
import { NotificationsComponent } from "./components/notifications.component";

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
    MenusPredefinidosComponent,
    NotificationsComponent,
  ],
  template: `
    <div class="min-h-screen bg-gray-50">
      <app-header></app-header>
      <app-navigation
        [activeTab]="activeTab"
        (tabChange)="onTabChange($event)"
      ></app-navigation>
      <app-notifications></app-notifications>

      <main class="container mx-auto max-w-7xl">
        @switch (activeTab) { @case ('predefined') {
        <app-menus-predefinidos></app-menus-predefinidos>
        } @case ('dishes') {
        <app-dishes-management></app-dishes-management>
        } @case ('inventory') {
        <app-inventory-management></app-inventory-management>
        } @case ('shopping') {
        <app-shopping-list></app-shopping-list>
        } @case ('history') {
        <app-history></app-history>
        } @default {

        <app-weekly-menu></app-weekly-menu>
        } }
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
    // Los datos iniciales ahora se manejan desde Supabase
    // No es necesario inicializar datos locales
  }

  onTabChange(tab: string): void {
    this.activeTab = tab;
  }

  // Los datos iniciales ahora se manejan desde Supabase
  // Este método ya no es necesario
  /*
  private initializeSampleData(): void {
    // Datos iniciales movidos a Supabase - ver database_migration_postgresql.sql
  }
  */
}

bootstrapApplication(App, {
  providers: [
    provideServiceWorker("ngsw-worker.js", {
      enabled: !isDevMode(),
      registrationStrategy: "registerWhenStable:30000",
    }),
  ],
});

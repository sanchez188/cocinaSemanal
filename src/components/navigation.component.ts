import { Component, EventEmitter, Output, Input } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-navigation",
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="bg-white shadow-sm border-b">
      <div class="container mx-auto px-4">
        <div class="flex space-x-0 overflow-x-auto">
          <button
            *ngFor="let tab of tabs"
            (click)="selectTab(tab.id)"
            [class]="getTabClass(tab.id)"
            class="flex-shrink-0 px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 hover:text-green-600"
          >
            <span class="mr-2">{{ tab.icon }}</span>
            {{ tab.label }}
          </button>
        </div>
      </div>
    </nav>
  `,
})
export class NavigationComponent {
  @Input() activeTab: string = "menu";
  @Output() tabChange = new EventEmitter<string>();

  tabs = [
    { id: "menu", label: "Menú Semanal", icon: "📅" },
    { id: "predefined", label: "Menú Predefinidos", icon: "📅" },
    { id: "dishes", label: "Platillos", icon: "🍲" },
    { id: "inventory", label: "Inventario", icon: "📦" },
    { id: "shopping", label: "Lista de Compras", icon: "🛒" },
    { id: "history", label: "Historial", icon: "📊" },
  ];

  selectTab(tabId: string): void {
    this.tabChange.emit(tabId);
  }

  getTabClass(tabId: string): string {
    const baseClass = "";
    if (tabId === this.activeTab) {
      return baseClass + " text-green-600 border-green-600 bg-green-50";
    }
    return baseClass + " text-gray-600 border-transparent";
  }
}

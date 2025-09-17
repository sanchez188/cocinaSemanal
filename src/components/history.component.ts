import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShoppingService } from '../services/shopping.service';
import { Purchase, WeeklyData } from '../models/interfaces';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Historial y Estadísticas</h2>
          <p class="text-gray-600">Revisa tus compras y exporta/importa datos</p>
        </div>
        
        <div class="flex space-x-3">
          <button
            (click)="exportCurrentWeek()"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            📤 Exportar Semana
          </button>
          
          <label class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors cursor-pointer">
            📥 Importar Datos
            <input
              type="file"
              accept=".json"
              (change)="onFileSelected($event)"
              class="hidden"
            >
          </label>
        </div>
      </div>

      <!-- Import/Export Section -->
      <div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h3 class="text-lg font-semibold mb-4">Gestión de Datos</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 class="font-medium mb-2">Exportar Datos</h4>
            <p class="text-sm text-gray-600 mb-3">
              Descarga todos los datos de la semana actual en formato JSON para respaldo o transferencia.
            </p>
            <button
              (click)="exportCurrentWeek()"
              class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Exportar Semana Actual
            </button>
          </div>
          
          <div>
            <h4 class="font-medium mb-2">Importar Datos</h4>
            <p class="text-sm text-gray-600 mb-3">
              Sube un archivo JSON para cargar datos de menú, inventario y compras de otra semana.
            </p>
            <div class="flex items-center space-x-3">
              <label class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors cursor-pointer">
                Seleccionar Archivo
                <input
                  type="file"
                  accept=".json"
                  (change)="onFileSelected($event)"
                  class="hidden"
                >
              </label>
              @if (selectedFile()) {
                <span class="text-sm text-gray-600">{{ selectedFile()!.name }}</span>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Purchase History -->
      <div class="bg-white rounded-lg shadow-sm border mb-6">
        <div class="p-4 border-b">
          <h3 class="text-lg font-semibold">Historial de Compras</h3>
        </div>
        
        @if (purchases().length === 0) {
          <div class="p-6 text-center">
            <div class="text-gray-400 text-4xl mb-4">📊</div>
            <p class="text-gray-500">No hay compras registradas aún</p>
          </div>
        } @else {
          <div class="divide-y divide-gray-200">
            @for (purchase of purchases(); track purchase.id) {
              <div class="p-4">
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <div class="font-semibold">Compra del {{ formatDate(purchase.date) }}</div>
                    <div class="text-sm text-gray-500">Semana: {{ purchase.weekId }}</div>
                  </div>
                  <div class="text-right">
                    <div class="text-xl font-bold text-green-600">\${{ purchase.totalCost.toFixed(2) }}</div>
                    <div class="text-sm text-gray-500">{{ purchase.items.length }} artículos</div>
                  </div>
                </div>
                
                <details class="mt-3">
                  <summary class="cursor-pointer text-blue-600 hover:text-blue-800 text-sm">Ver detalles</summary>
                  <div class="mt-3 pl-4 border-l-2 border-gray-200">
                    <div class="grid gap-2">
                      @for (item of purchase.items; track item.ingredientId) {
                        <div class="flex justify-between text-sm">
                          <span>{{ item.name }} ({{ item.quantity }} {{ item.unit }})</span>
                          <span>\${{ item.totalPrice.toFixed(2) }}</span>
                        </div>
                      }
                    </div>
                  </div>
                </details>
              </div>
            }
          </div>
        }
      </div>

      <!-- Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-lg shadow-sm border p-4">
          <div class="text-sm font-medium text-gray-500">Total Compras</div>
          <div class="text-2xl font-bold text-gray-900">{{ purchases().length }}</div>
        </div>
        
        <div class="bg-white rounded-lg shadow-sm border p-4">
          <div class="text-sm font-medium text-gray-500">Gasto Total</div>
          <div class="text-2xl font-bold text-green-600">\${{ getTotalSpent().toFixed(2) }}</div>
        </div>
        
        <div class="bg-white rounded-lg shadow-sm border p-4">
          <div class="text-sm font-medium text-gray-500">Promedio por Compra</div>
          <div class="text-2xl font-bold text-blue-600">\${{ getAverageSpent().toFixed(2) }}</div>
        </div>
        
        <div class="bg-white rounded-lg shadow-sm border p-4">
          <div class="text-sm font-medium text-gray-500">Artículos Comprados</div>
          <div class="text-2xl font-bold text-purple-600">{{ getTotalItems() }}</div>
        </div>
      </div>
    </div>
  `
})
export class HistoryComponent implements OnInit {
  private shoppingService = inject(ShoppingService);

  purchases = signal<Purchase[]>([]);
  selectedFile = signal<File | null>(null);

  ngOnInit(): void {
    this.shoppingService.purchases$.subscribe(purchases => {
      this.purchases.set(purchases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });
  }

  async exportCurrentWeek(): Promise<void> {
    const currentWeek = this.getCurrentWeek();
    const weeklyData = await this.shoppingService.exportWeeklyData(currentWeek);
    
    if (weeklyData) {
      const dataStr = JSON.stringify(weeklyData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `meal-planner-week-${currentWeek}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      this.showSuccessMessage('Datos exportados exitosamente');
    } else {
      alert('No hay datos disponibles para exportar');
    }
  }

  async onFileSelected(event: any): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) return;
    
    this.selectedFile.set(file);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const weeklyData: WeeklyData = JSON.parse(content);
        
        const success = await this.shoppingService.importWeeklyData(weeklyData);
        
        if (success) {
          this.showSuccessMessage('¡Datos importados exitosamente!');
          this.selectedFile.set(null);
          // Reset file input
          event.target.value = '';
        } else {
          alert('Error al importar los datos. Verifica el formato del archivo.');
        }
      } catch (error) {
        alert('Error al leer el archivo. Asegúrate de que sea un JSON válido.');
        console.error('Import error:', error);
      }
    };
    
    reader.readAsText(file);
  }

  private getCurrentWeek(): string {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    return monday.toISOString().split('T')[0];
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getTotalSpent(): number {
    return this.purchases().reduce((total, purchase) => total + purchase.totalCost, 0);
  }

  getAverageSpent(): number {
    const purchaseList = this.purchases();
    if (purchaseList.length === 0) return 0;
    return this.getTotalSpent() / purchaseList.length;
  }

  getTotalItems(): number {
    return this.purchases().reduce((total, purchase) => total + purchase.items.length, 0);
  }

  private showSuccessMessage(message: string): void {
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
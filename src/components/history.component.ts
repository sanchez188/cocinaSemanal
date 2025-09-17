import { Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ShoppingService } from "../services/shopping.service";
import { Purchase, WeeklyData } from "../models/interfaces";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-history",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./history.component.html",
})
export class HistoryComponent implements OnInit {
  private shoppingService = inject(ShoppingService);

  purchases = signal<Purchase[]>([]);
  selectedFile = signal<File | null>(null);

  ngOnInit(): void {
    // Ordena las compras por fecha descendente y actualiza el signal
    const sorted = this.shoppingService
      .purchases()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    this.purchases.set(sorted);
  }

  async exportCurrentWeek(): Promise<void> {
    const currentWeek = this.getCurrentWeek();
    const weeklyData = this.shoppingService.exportWeeklyData(currentWeek);
    if (weeklyData) {
      const dataStr = JSON.stringify(weeklyData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `meal-planner-week-${currentWeek}.json`;
      link.click();
      URL.revokeObjectURL(url);
      alert("Datos exportados exitosamente");
    } else {
      alert("No hay datos disponibles para exportar");
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
        const success = this.shoppingService.importWeeklyData(weeklyData);
        if (success) {
          alert("¡Datos importados exitosamente!");
          this.selectedFile.set(null);
          event.target.value = "";
        } else {
          alert(
            "Error al importar los datos. Verifica el formato del archivo."
          );
        }
      } catch (error) {
        alert("Error al leer el archivo. Asegúrate de que sea un JSON válido.");
        console.error("Import error:", error);
      }
    };
    reader.readAsText(file);
  }

  private getCurrentWeek(): string {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    return monday.toISOString().split("T")[0];
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  getTotalSpent(): number {
    return this.purchases().reduce(
      (total: number, purchase: Purchase) => total + purchase.totalCost,
      0
    );
  }

  getAverageSpent(): number {
    const purchaseList = this.purchases();
    if (purchaseList.length === 0) return 0;
    return this.getTotalSpent() / purchaseList.length;
  }

  getTotalItems(): number {
    return this.purchases().reduce(
      (total: number, purchase: Purchase) => total + purchase.items.length,
      0
    );
  }
}

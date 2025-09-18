import { Injectable } from "@angular/core";
import { signal, WritableSignal } from "@angular/core";
import { Ingredient } from "../models/interfaces";
import { CocinaSemanalDB, InventoryItem } from "./db.service";

@Injectable({
  providedIn: "root",
})
export class InventoryService {
  /**
   * Suma todos los ingredientes usados en un menú y los devuelve al inventario.
   */
  async batchAddIngredientsFromMenu(menu: {
    days: { [day: string]: any[] };
  }): Promise<void> {
    const toAdd: {
      [id: string]: {
        quantity: number;
        name?: string;
        unit?: string;
        pricePerUnit?: number;
      };
    } = {};
    for (const day of Object.keys(menu.days)) {
      for (const dish of menu.days[day]) {
        if (dish.ingredients) {
          for (const ing of dish.ingredients) {
            if (!toAdd[ing.ingredientId]) {
              toAdd[ing.ingredientId] = {
                quantity: 0,
                name: ing.name,
                unit: ing.unit,
                pricePerUnit: ing.pricePerUnit,
              };
            }
            toAdd[ing.ingredientId].quantity += ing.quantity;
          }
        }
      }
    }
    // Convertir a array y agregar al inventario
    const addArray = Object.entries(toAdd).map(([ingredientId, data]) => ({
      ingredientId,
      name: data.name,
      quantity: data.quantity,
      unit: data.unit,
      pricePerUnit: data.pricePerUnit,
    }));
    await this.addToInventory(addArray);
  }
  /**
   * Recalcula el inventario descontando los ingredientes usados en el menú semanal.
   */
  recalculateInventoryFromMenu(menu: { days: { [day: string]: any[] } }): void {
    // Copia el inventario actual
    const inventory = [...this.inventorySignal()];
    // Sumar ingredientes usados en el menú
    const used: { [id: string]: number } = {};
    for (const day of Object.keys(menu.days)) {
      for (const dish of menu.days[day]) {
        if (dish.ingredients) {
          for (const ing of dish.ingredients) {
            used[ing.ingredientId] =
              (used[ing.ingredientId] || 0) + ing.quantity;
          }
        }
      }
    }
    // Descontar del inventario
    for (const item of inventory) {
      if (used[item.id]) {
        item.quantity = Math.max(0, item.quantity - used[item.id]);
      }
    }
    this.inventorySignal.set([...inventory]);
    this.saveInventory();
  }
  /**
   * Agrega múltiples ingredientes al inventario, soportando unidad y paquete.
   */
  async batchAddIngredients(
    items: Array<{
      name: string;
      unit: string;
      isPackage?: boolean;
      quantity: number;
      pricePerUnit?: number;
      priceTotal?: number;
      category?: string;
    }>
  ): Promise<void> {
    try {
      const ingredients: Ingredient[] = items.map((item) => ({
        id:
          item.name.toLowerCase().replace(/\s+/g, "-") +
          "-" +
          Math.floor(Math.random() * 10000),
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        pricePerUnit: item.isPackage ? 0 : item.pricePerUnit || 0,
        priceTotal: item.isPackage ? item.priceTotal || 0 : undefined,
        isPackage: !!item.isPackage,
        category: item.category || "otros",
      }));

      await this.db.inventory.bulkAdd(ingredients);
      await this.initInventory();
    } catch (error) {
      console.error("Error batch adding ingredients:", error);
    }
  }
  private inventorySignal: WritableSignal<Ingredient[]> = signal([]);
  public inventory = this.inventorySignal;

  constructor(private db: CocinaSemanalDB) {
    this.initInventory();
  }

  private async initInventory(): Promise<void> {
    // Migrar de localStorage si existe y Dexie está vacío
    const dexieItems = await this.db.inventory.toArray();
    if (dexieItems.length === 0) {
      const local = localStorage.getItem("meal-planner-inventory");
      if (local) {
        const items: Ingredient[] = JSON.parse(local);
        for (const item of items) {
          await this.db.inventory.put(item);
        }
        localStorage.removeItem("meal-planner-inventory");
        this.inventorySignal.set(items);
        return;
      }
    }
    // Mapear a Ingredient si es necesario
    this.inventorySignal.set(dexieItems as Ingredient[]);
    // Si el inventario está vacío, cargar productos iniciales
    if (this.getInventory().length === 0) {
      this.batchAddIngredients([
        {
          name: "Arroz",
          unit: "kg",
          quantity: 1,
          pricePerUnit: 0,
          category: "cereales",
        },
        {
          name: "Frijoles",
          unit: "kg",
          quantity: 1,
          pricePerUnit: 0,
          category: "cereales",
        },
        {
          name: "Harina",
          unit: "kg",
          quantity: 1,
          pricePerUnit: 0,
          category: "cereales",
        },
        {
          name: "Cereal",
          unit: "paquete",
          quantity: 1,
          isPackage: true,
          priceTotal: 0,
          category: "cereales",
        },
        {
          name: "Leche Nido",
          unit: "Latas",
          quantity: 1,
          pricePerUnit: 0,
          category: "lacteos",
        },
        {
          name: "Leche",
          unit: "litro",
          quantity: 1,
          pricePerUnit: 0,
          category: "lacteos",
        },
        {
          name: "Queso",
          unit: "kg",
          quantity: 1,
          pricePerUnit: 0,
          category: "lacteos",
        },
        {
          name: "Queso crema",
          unit: "paquete",
          quantity: 1,
          isPackage: true,
          priceTotal: 0,
          category: "lacteos",
        },
        {
          name: "Jamón",
          unit: "paquete",
          quantity: 1,
          isPackage: true,
          priceTotal: 0,
          category: "carnes",
        },
        {
          name: "Atún con vegetales",
          unit: "Latas",
          quantity: 4,
          pricePerUnit: 0,
          category: "carnes",
        },
        {
          name: "Atún azul",
          unit: "Latas",
          quantity: 2,
          pricePerUnit: 0,
          category: "carnes",
        },
        {
          name: "Zanahoria",
          unit: "kg",
          quantity: 1,
          pricePerUnit: 0,
          category: "verduras",
        },
        {
          name: "Repollo",
          unit: "unidad",
          quantity: 1,
          pricePerUnit: 0,
          category: "verduras",
        },
        {
          name: "Maíz dulce",
          unit: "Latas",
          quantity: 1,
          pricePerUnit: 0,
          category: "verduras",
        },
        {
          name: "Bananos",
          unit: "unidad",
          quantity: 1,
          pricePerUnit: 0,
          category: "frutas",
        },
        {
          name: "Uvas verdes",
          unit: "kg",
          quantity: 1,
          pricePerUnit: 0,
          category: "frutas",
        },
        {
          name: "Tostada integral",
          unit: "paquete",
          quantity: 1,
          isPackage: true,
          priceTotal: 0,
          category: "cereales",
        },
        {
          name: "Royal",
          unit: "paquete",
          quantity: 1,
          isPackage: true,
          priceTotal: 0,
          category: "otros",
        },
        {
          name: "Frijoles molidos Sin picante",
          unit: "paquete",
          quantity: 1,
          isPackage: true,
          priceTotal: 0,
          category: "cereales",
        },
        {
          name: "Frijoles molidos picantes",
          unit: "paquete",
          quantity: 1,
          isPackage: true,
          priceTotal: 0,
          category: "cereales",
        },
        {
          name: "Papel higiénico",
          unit: "paquete",
          quantity: 1,
          isPackage: true,
          priceTotal: 0,
          category: "otros",
        },
        {
          name: "Galleta María",
          unit: "paquete",
          quantity: 1,
          isPackage: true,
          priceTotal: 0,
          category: "galletas",
        },
        {
          name: "Club soda",
          unit: "paquete",
          quantity: 1,
          isPackage: true,
          priceTotal: 0,
          category: "galletas",
        },
        {
          name: "Galleta de Avena",
          unit: "paquete",
          quantity: 1,
          isPackage: true,
          priceTotal: 0,
          category: "galletas",
        },
        {
          name: "Galleta dulce",
          unit: "paquete",
          quantity: 1,
          isPackage: true,
          priceTotal: 0,
          category: "galletas",
        },
        {
          name: "Aceite",
          unit: "litro",
          quantity: 1,
          pricePerUnit: 0,
          category: "liquidos",
        },
      ]);
    }
  }

  async saveInventory(): Promise<void> {
    const items = this.inventorySignal();
    for (const item of items) {
      await this.db.inventory.put(item);
    }
  }

  getInventory(): Ingredient[] {
    return this.inventorySignal();
  }

  async addIngredient(ingredient: Ingredient): Promise<void> {
    const currentInventory = this.inventorySignal();
    const existingIndex = currentInventory.findIndex(
      (item) => item.id === ingredient.id
    );
    if (existingIndex !== -1) {
      currentInventory[existingIndex] = ingredient;
    } else {
      currentInventory.push(ingredient);
    }
    this.inventorySignal.set([...currentInventory]);
    await this.saveInventory();
    await this.initInventory();
  }

  async updateIngredient(ingredient: Ingredient): Promise<void> {
    const currentInventory = this.inventorySignal();
    const index = currentInventory.findIndex(
      (item) => item.id === ingredient.id
    );
    if (index !== -1) {
      currentInventory[index] = ingredient;
      this.inventorySignal.set([...currentInventory]);
      await this.saveInventory();
      await this.initInventory();
    }
  }

  async removeIngredient(id: string): Promise<void> {
    const currentInventory = this.inventorySignal().filter(
      (item) => item.id !== id
    );
    this.inventorySignal.set(currentInventory);
    await this.saveInventory();
    await this.initInventory();
  }

  /**
   * Consume ingredientes que tengan suficiente stock y devuelve los faltantes.
   * Devuelve un array con los ids de los ingredientes que no pudieron descontarse.
   */
  async consumeIngredients(
    ingredients: { ingredientId: string; quantity: number }[]
  ): Promise<string[]> {
    const currentInventory = [...this.inventorySignal()];
    const missing: string[] = [];
    for (const ingredient of ingredients) {
      const inventoryItem = currentInventory.find(
        (item) => item.id === ingredient.ingredientId
      );
      if (!inventoryItem || inventoryItem.quantity < ingredient.quantity) {
        missing.push(ingredient.ingredientId);
      } else {
        inventoryItem.quantity -= ingredient.quantity;
      }
    }
    this.inventorySignal.set(currentInventory);
    await this.saveInventory();
    await this.initInventory();
    return missing;
  }

  async addToInventory(
    ingredients: {
      ingredientId: string;
      name?: string;
      quantity: number;
      unit?: string;
      pricePerUnit?: number;
    }[]
  ): Promise<void> {
    const currentInventory = [...this.inventorySignal()];
    for (const ingredient of ingredients) {
      let inventoryItem = currentInventory.find(
        (item) => item.id === ingredient.ingredientId
      );
      if (inventoryItem) {
        inventoryItem.quantity += ingredient.quantity;
      } else {
        // Agregar nuevo producto al inventario si no existe
        inventoryItem = {
          id: ingredient.ingredientId,
          name: ingredient.name || "Nuevo producto",
          quantity: ingredient.quantity,
          unit: ingredient.unit || "unidades",
          pricePerUnit: ingredient.pricePerUnit || 0,
          category: "otros",
        };
        currentInventory.push(inventoryItem);
      }
    }
    this.inventorySignal.set(currentInventory);
    await this.saveInventory();
    await this.initInventory();
  }
}

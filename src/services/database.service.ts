import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { 
  Ingredient, 
  Dish, 
  WeeklyMenu, 
  ShoppingList, 
  Purchase,
  WeeklyData 
} from '../models/interfaces';

export interface PredefinedMenu {
  id: string;
  name: string;
  days: {
    [day: string]: Dish[];
  };
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService extends Dexie {
  ingredients!: Table<Ingredient>;
  dishes!: Table<Dish>;
  weeklyMenus!: Table<WeeklyMenu>;
  shoppingLists!: Table<ShoppingList>;
  purchases!: Table<Purchase>;
  predefinedMenus!: Table<PredefinedMenu>;

  constructor() {
    super('MealPlannerDB');
    
    this.version(1).stores({
      ingredients: 'id, name, category, quantity',
      dishes: 'id, name, category',
      weeklyMenus: 'id, week',
      shoppingLists: 'id, weekId, completed',
      purchases: 'id, weekId, date',
      predefinedMenus: 'id, name, createdAt'
    });

    this.on('ready', () => this.initializeData());
  }

  private async initializeData(): Promise<void> {
    // Check if we already have data
    const ingredientCount = await this.ingredients.count();
    
    if (ingredientCount === 0) {
      await this.seedInitialData();
    }
  }

  private async seedInitialData(): Promise<void> {
    const sampleIngredients: Ingredient[] = [
      {
        id: "arroz-001",
        name: "Arroz",
        quantity: 1,
        unit: "kg",
        pricePerUnit: 0,
        category: "cereales",
      },
      {
        id: "frijoles-001",
        name: "Frijoles",
        quantity: 1,
        unit: "kg",
        pricePerUnit: 0,
        category: "cereales",
      },
      {
        id: "harina-001",
        name: "Harina",
        quantity: 1,
        unit: "kg",
        pricePerUnit: 0,
        category: "cereales",
      },
      {
        id: "cereal-001",
        name: "Cereal",
        quantity: 1,
        unit: "paquete",
        pricePerUnit: 0,
        category: "cereales",
        isPackage: true,
        priceTotal: 0,
      },
      {
        id: "leche-nido-001",
        name: "Leche Nido",
        quantity: 1,
        unit: "Latas",
        pricePerUnit: 0,
        category: "lacteos",
      },
      {
        id: "leche-001",
        name: "Leche",
        quantity: 1,
        unit: "litro",
        pricePerUnit: 0,
        category: "lacteos",
      },
      {
        id: "queso-001",
        name: "Queso",
        quantity: 1,
        unit: "kg",
        pricePerUnit: 0,
        category: "lacteos",
      },
      {
        id: "queso-crema-001",
        name: "Queso crema",
        quantity: 1,
        unit: "paquete",
        pricePerUnit: 0,
        category: "lacteos",
        isPackage: true,
        priceTotal: 0,
      },
      {
        id: "jamon-001",
        name: "Jamón",
        quantity: 1,
        unit: "paquete",
        pricePerUnit: 0,
        category: "carnes",
        isPackage: true,
        priceTotal: 0,
      },
      {
        id: "atun-vegetales-001",
        name: "Atún con vegetales",
        quantity: 4,
        unit: "Latas",
        pricePerUnit: 0,
        category: "carnes",
      },
      {
        id: "atun-azul-001",
        name: "Atún azul",
        quantity: 2,
        unit: "Latas",
        pricePerUnit: 0,
        category: "carnes",
      },
      {
        id: "zanahoria-001",
        name: "Zanahoria",
        quantity: 1,
        unit: "kg",
        pricePerUnit: 0,
        category: "verduras",
      },
      {
        id: "repollo-001",
        name: "Repollo",
        quantity: 1,
        unit: "unidad",
        pricePerUnit: 0,
        category: "verduras",
      },
      {
        id: "maiz-dulce-001",
        name: "Maíz dulce",
        quantity: 1,
        unit: "Latas",
        pricePerUnit: 0,
        category: "verduras",
      },
      {
        id: "bananos-001",
        name: "Bananos",
        quantity: 1,
        unit: "unidad",
        pricePerUnit: 0,
        category: "frutas",
      },
      {
        id: "uvas-verdes-001",
        name: "Uvas verdes",
        quantity: 1,
        unit: "kg",
        pricePerUnit: 0,
        category: "frutas",
      },
      {
        id: "tostada-integral-001",
        name: "Tostada integral",
        quantity: 1,
        unit: "paquete",
        pricePerUnit: 0,
        category: "cereales",
        isPackage: true,
        priceTotal: 0,
      },
      {
        id: "royal-001",
        name: "Royal",
        quantity: 1,
        unit: "paquete",
        pricePerUnit: 0,
        category: "otros",
        isPackage: true,
        priceTotal: 0,
      },
      {
        id: "frijoles-sin-picante-001",
        name: "Frijoles molidos Sin picante",
        quantity: 1,
        unit: "paquete",
        pricePerUnit: 0,
        category: "cereales",
        isPackage: true,
        priceTotal: 0,
      },
      {
        id: "frijoles-picantes-001",
        name: "Frijoles molidos picantes",
        quantity: 1,
        unit: "paquete",
        pricePerUnit: 0,
        category: "cereales",
        isPackage: true,
        priceTotal: 0,
      },
      {
        id: "papel-higienico-001",
        name: "Papel higiénico",
        quantity: 1,
        unit: "paquete",
        pricePerUnit: 0,
        category: "limpieza",
        isPackage: true,
        priceTotal: 0,
      },
      {
        id: "galleta-maria-001",
        name: "Galleta María",
        quantity: 1,
        unit: "paquete",
        pricePerUnit: 0,
        category: "galletas",
        isPackage: true,
        priceTotal: 0,
      },
      {
        id: "club-soda-001",
        name: "Club soda",
        quantity: 1,
        unit: "paquete",
        pricePerUnit: 0,
        category: "galletas",
        isPackage: true,
        priceTotal: 0,
      },
      {
        id: "galleta-avena-001",
        name: "Galleta de Avena",
        quantity: 1,
        unit: "paquete",
        pricePerUnit: 0,
        category: "galletas",
        isPackage: true,
        priceTotal: 0,
      },
      {
        id: "galleta-dulce-001",
        name: "Galleta dulce",
        quantity: 1,
        unit: "paquete",
        pricePerUnit: 0,
        category: "galletas",
        isPackage: true,
        priceTotal: 0,
      },
      {
        id: "aceite-001",
        name: "Aceite",
        quantity: 1,
        unit: "litro",
        pricePerUnit: 0,
        category: "otros",
      },
    ];

    const sampleDishes: Dish[] = [
      {
        id: "dish-001",
        name: "Huevos Revueltos",
        category: "desayuno",
        servings: 2,
        ingredients: [
          { ingredientId: "huevos-001", quantity: 3 },
          { ingredientId: "aceite-001", quantity: 0.01 },
        ],
      },
      {
        id: "dish-002",
        name: "Arroz con Pollo",
        category: "almuerzo",
        servings: 4,
        ingredients: [
          { ingredientId: "arroz-001", quantity: 0.25 },
          { ingredientId: "pollo-001", quantity: 0.4 },
          { ingredientId: "aceite-001", quantity: 0.02 },
        ],
      },
      {
        id: "dish-003",
        name: "Café con Galletas",
        category: "cafe",
        servings: 1,
        ingredients: [
          { ingredientId: "galleta-maria-001", quantity: 0.1 },
        ],
      },
      {
        id: "dish-004",
        name: "Frijoles con Arroz",
        category: "cena",
        servings: 2,
        ingredients: [
          { ingredientId: "frijoles-001", quantity: 0.2 },
          { ingredientId: "arroz-001", quantity: 0.15 },
        ],
      },
    ];

    await this.ingredients.bulkAdd(sampleIngredients);
    await this.dishes.bulkAdd(sampleDishes);
  }

  // Utility methods for data operations
  async exportWeeklyData(week: string): Promise<WeeklyData | null> {
    try {
      const menu = await this.weeklyMenus.where('week').equals(week).first();
      const ingredients = await this.ingredients.toArray();
      const shoppingList = await this.shoppingLists.where('weekId').equals(week).first();
      const purchases = await this.purchases.where('weekId').equals(week).toArray();

      if (!menu) return null;

      return {
        week,
        menu,
        inventory: ingredients,
        shoppingList: shoppingList || {
          id: '',
          weekId: week,
          items: [],
          totalCost: 0,
          completed: false,
          createdAt: new Date(),
        },
        purchases,
      };
    } catch (error) {
      console.error('Error exporting weekly data:', error);
      return null;
    }
  }

  async importWeeklyData(data: WeeklyData): Promise<boolean> {
    try {
      await this.transaction('rw', [this.weeklyMenus, this.ingredients, this.shoppingLists, this.purchases], async () => {
        // Save menu
        await this.weeklyMenus.put(data.menu);

        // Update inventory (merge with existing)
        for (const ingredient of data.inventory) {
          const existing = await this.ingredients.get(ingredient.id);
          if (!existing) {
            await this.ingredients.add(ingredient);
          }
        }

        // Save shopping list
        if (data.shoppingList.id) {
          await this.shoppingLists.put(data.shoppingList);
        }

        // Add purchases
        for (const purchase of data.purchases) {
          const existing = await this.purchases.get(purchase.id);
          if (!existing) {
            await this.purchases.add(purchase);
          }
        }
      });

      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}
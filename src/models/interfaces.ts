export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  category: string;
  isPackage?: boolean; // true si el item se maneja por paquete
  priceTotal?: number; // precio total del paquete (si aplica)
}

export interface Dish {
  id: string;
  name: string;
  ingredients: DishIngredient[];
  category: "desayuno" | "almuerzo" | "cafe" | "cena";
  servings: number;
}

export interface DishIngredient {
  ingredientId: string;
  quantity: number;
}

export interface WeeklyMenu {
  id: string;
  week: string; // YYYY-MM-DD format for Monday of the week
  meals: {
    [day: string]: {
      desayuno: string[];
      almuerzo: string[];
      cafe: string[];
      cena: string[];
    };
  };
  warnings?: {
    [day: string]: {
      [meal: string]: {
        [dishId: string]: string[] | null;
      };
    };
  };
}

export interface ShoppingList {
  id: string;
  weekId: string;
  items: ShoppingItem[];
  totalCost: number;
  completed: boolean;
  createdAt: Date;
}

export interface ShoppingItem {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  purchased: boolean;
}

export interface Purchase {
  id: string;
  weekId: string;
  items: PurchaseItem[];
  totalCost: number;
  date: Date;
}

export interface PurchaseItem {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
}

export interface WeeklyData {
  week: string;
  menu: WeeklyMenu;
  inventory: Ingredient[];
  shoppingList: ShoppingList;
  purchases: Purchase[];
}

// Días de la semana normalizados (minúscula, sin acentos)
export const DAYS_OF_WEEK = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
];

// Categorías de comidas en orden del día
export const MEAL_CATEGORIES = [
  { id: "desayuno", label: "Desayuno", icon: "🌅" },
  { id: "merienda", label: "Merienda", icon: "🥐" },
  { id: "almuerzo", label: "Almuerzo", icon: "🍽️" },
  { id: "cafe", label: "Café", icon: "☕" },
  { id: "cena", label: "Cena", icon: "🌙" },
] as const;

export type MealCategory = (typeof MEAL_CATEGORIES)[number]["id"];
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
  category: MealCategory;
  servings: number;
}

export interface DishIngredient {
  ingredientId: string;
  quantity: number;
}

export interface WeeklyMenu {
  id: string;
  week: string; // YYYY-MM-DD format for Monday of the week
  days: { [day: string]: Dish[] };
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

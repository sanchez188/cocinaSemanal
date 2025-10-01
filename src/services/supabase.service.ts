import { Injectable } from "@angular/core";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { environment } from "../environments/environment";
import {
  Ingredient,
  Dish,
  WeeklyMenu,
  ShoppingList,
  Purchase,
  DishIngredient,
  ShoppingItem,
  PurchaseItem,
} from "../models/interfaces";

export interface PredefinedMenu {
  id: string;
  name: string;
  days: {
    [day: string]: Dish[];
  };
  created_at?: Date;
  updated_at?: Date;
}

// Interfaces para las tablas normalizadas de PostgreSQL
export interface WeeklyMenuDish {
  id?: string;
  weekly_menu_id: string;
  day_of_week: string;
  dish_id: string;
  meal_order?: number;
}

export interface DishIngredientDB {
  id?: string;
  dish_id: string;
  ingredient_id: string;
  quantity: number;
}

@Injectable({
  providedIn: "root",
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey
    );
  }

  // ============================================================================
  // INGREDIENTES
  // ============================================================================

  async getIngredients(): Promise<Ingredient[]> {
    const { data, error } = await this.supabase
      .from("ingredients")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching ingredients:", error);
      return [];
    }

    return (
      data?.map((ingredient) => ({
        id: ingredient.id,
        name: ingredient.name,
        quantity: parseFloat(ingredient.quantity),
        unit: ingredient.unit,
        pricePerUnit: parseFloat(ingredient.price_per_unit),
        category: ingredient.category,
        isPackage: ingredient.is_package,
        priceTotal: ingredient.price_total
          ? parseFloat(ingredient.price_total)
          : undefined,
      })) || []
    );
  }

  async addIngredient(ingredient: Ingredient): Promise<boolean> {
    const { error } = await this.supabase.from("ingredients").insert({
      id: ingredient.id,
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      price_per_unit: ingredient.pricePerUnit,
      category: ingredient.category,
      is_package: ingredient.isPackage || false,
      price_total: ingredient.priceTotal,
    });

    if (error) {
      console.error("Error adding ingredient:", error);
      return false;
    }

    return true;
  }

  async updateIngredient(ingredient: Ingredient): Promise<boolean> {
    const { error } = await this.supabase
      .from("ingredients")
      .update({
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        price_per_unit: ingredient.pricePerUnit,
        category: ingredient.category,
        is_package: ingredient.isPackage || false,
        price_total: ingredient.priceTotal,
      })
      .eq("id", ingredient.id);

    if (error) {
      console.error("Error updating ingredient:", error);
      return false;
    }

    return true;
  }

  async deleteIngredient(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from("ingredients")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting ingredient:", error);
      return false;
    }

    return true;
  }

  // ============================================================================
  // PLATOS
  // ============================================================================

  async getDishes(): Promise<Dish[]> {
    // Obtener platos con sus ingredientes usando la vista
    const { data, error } = await this.supabase
      .from("dish_details")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching dishes:", error);
      return [];
    }

    return (
      data?.map((dish) => ({
        id: dish.id,
        name: dish.name,
        category: dish.category,
        servings: dish.servings,
        ingredients: dish.ingredients || [],
      })) || []
    );
  }

  async addDish(dish: Dish): Promise<boolean> {
    try {
      // Insertar el plato
      const { error: dishError } = await this.supabase.from("dishes").insert({
        id: dish.id,
        name: dish.name,
        category: dish.category,
        servings: dish.servings,
      });

      if (dishError) throw dishError;

      // Insertar los ingredientes del plato
      if (dish.ingredients && dish.ingredients.length > 0) {
        const dishIngredients = dish.ingredients.map((ingredient) => ({
          dish_id: dish.id,
          ingredient_id: ingredient.ingredientId,
          quantity: ingredient.quantity,
        }));

        const { error: ingredientsError } = await this.supabase
          .from("dish_ingredients")
          .insert(dishIngredients);

        if (ingredientsError) throw ingredientsError;
      }

      return true;
    } catch (error) {
      console.error("Error adding dish:", error);
      return false;
    }
  }

  async updateDish(dish: Dish): Promise<boolean> {
    try {
      // Actualizar el plato
      const { error: dishError } = await this.supabase
        .from("dishes")
        .update({
          name: dish.name,
          category: dish.category,
          servings: dish.servings,
        })
        .eq("id", dish.id);

      if (dishError) throw dishError;

      // Eliminar ingredientes existentes
      await this.supabase
        .from("dish_ingredients")
        .delete()
        .eq("dish_id", dish.id);

      // Insertar nuevos ingredientes
      if (dish.ingredients && dish.ingredients.length > 0) {
        const dishIngredients = dish.ingredients.map((ingredient) => ({
          dish_id: dish.id,
          ingredient_id: ingredient.ingredientId,
          quantity: ingredient.quantity,
        }));

        const { error: ingredientsError } = await this.supabase
          .from("dish_ingredients")
          .insert(dishIngredients);

        if (ingredientsError) throw ingredientsError;
      }

      return true;
    } catch (error) {
      console.error("Error updating dish:", error);
      return false;
    }
  }

  async deleteDish(id: string): Promise<boolean> {
    const { error } = await this.supabase.from("dishes").delete().eq("id", id);

    if (error) {
      console.error("Error deleting dish:", error);
      return false;
    }

    return true;
  }

  // ============================================================================
  // MENÚS SEMANALES
  // ============================================================================

  async getWeeklyMenus(): Promise<WeeklyMenu[]> {
    const { data, error } = await this.supabase
      .from("weekly_menu_details")
      .select("*")
      .order("week", { ascending: false });

    if (error) {
      console.error("Error fetching weekly menus:", error);
      return [];
    }

    return (
      data?.map((menu) => ({
        id: menu.id,
        week: menu.week,
        days: menu.days || {},
      })) || []
    );
  }

  async getWeeklyMenuByWeek(week: string): Promise<WeeklyMenu | null> {
    const { data, error } = await this.supabase
      .from("weekly_menu_details")
      .select("*")
      .eq("week", week)
      .single();

    if (error) {
      console.error("Error fetching weekly menu:", error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      week: data.week,
      days: data.days || {},
    };
  }

  async saveWeeklyMenu(menu: WeeklyMenu): Promise<boolean> {
    try {
      // Insertar o actualizar el menú semanal
      const { error: menuError } = await this.supabase
        .from("weekly_menus")
        .upsert({
          id: menu.id,
          week: menu.week,
        });

      if (menuError) throw menuError;

      // Eliminar platos existentes del menú
      await this.supabase
        .from("weekly_menu_dishes")
        .delete()
        .eq("weekly_menu_id", menu.id);

      // Insertar nuevos platos
      const menuDishes: WeeklyMenuDish[] = [];

      Object.entries(menu.days).forEach(([day, dishes]) => {
        dishes.forEach((dish, index) => {
          menuDishes.push({
            weekly_menu_id: menu.id,
            day_of_week: day,
            dish_id: dish.id,
            meal_order: index + 1,
          });
        });
      });

      if (menuDishes.length > 0) {
        const { error: dishesError } = await this.supabase
          .from("weekly_menu_dishes")
          .insert(menuDishes);

        if (dishesError) throw dishesError;
      }

      return true;
    } catch (error) {
      console.error("Error saving weekly menu:", error);
      return false;
    }
  }

  // ============================================================================
  // LISTAS DE COMPRAS
  // ============================================================================

  async getShoppingLists(): Promise<ShoppingList[]> {
    const { data, error } = await this.supabase
      .from("shopping_list_details")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching shopping lists:", error);
      return [];
    }

    return (
      data?.map((list) => ({
        id: list.id,
        weekId: list.week_id,
        items: list.items || [],
        totalCost: parseFloat(list.total_cost),
        completed: list.completed,
        createdAt: new Date(list.created_at),
      })) || []
    );
  }

  async getShoppingListByWeek(weekId: string): Promise<ShoppingList | null> {
    const { data, error } = await this.supabase
      .from("shopping_list_details")
      .select("*")
      .eq("week_id", weekId)
      .single();

    if (error) {
      console.error("Error fetching shopping list:", error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      weekId: data.week_id,
      items: data.items || [],
      totalCost: parseFloat(data.total_cost),
      completed: data.completed,
      createdAt: new Date(data.created_at),
    };
  }

  async saveShoppingList(shoppingList: ShoppingList): Promise<boolean> {
    try {
      // Insertar o actualizar la lista de compras
      const { error: listError } = await this.supabase
        .from("shopping_lists")
        .upsert({
          id: shoppingList.id,
          week_id: shoppingList.weekId,
          total_cost: shoppingList.totalCost,
          completed: shoppingList.completed,
        });

      if (listError) throw listError;

      // Eliminar items existentes
      await this.supabase
        .from("shopping_items")
        .delete()
        .eq("shopping_list_id", shoppingList.id);

      // Insertar nuevos items
      if (shoppingList.items && shoppingList.items.length > 0) {
        const items = shoppingList.items.map((item) => ({
          shopping_list_id: shoppingList.id,
          ingredient_id: item.ingredientId,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          price_per_unit: item.pricePerUnit,
          purchased: item.purchased,
        }));

        const { error: itemsError } = await this.supabase
          .from("shopping_items")
          .insert(items);

        if (itemsError) throw itemsError;
      }

      return true;
    } catch (error) {
      console.error("Error saving shopping list:", error);
      return false;
    }
  }

  // ============================================================================
  // COMPRAS
  // ============================================================================

  async getPurchases(): Promise<Purchase[]> {
    const { data: purchases, error } = await this.supabase
      .from("purchases")
      .select(
        `
        *,
        purchase_items (*)
      `
      )
      .order("purchase_date", { ascending: false });

    if (error) {
      console.error("Error fetching purchases:", error);
      return [];
    }

    return (
      purchases?.map((purchase) => ({
        id: purchase.id,
        weekId: purchase.week_id,
        totalCost: parseFloat(purchase.total_cost),
        date: new Date(purchase.purchase_date),
        items:
          purchase.purchase_items?.map((item: any) => ({
            ingredientId: item.ingredient_id,
            name: item.name,
            quantity: parseFloat(item.quantity),
            unit: item.unit,
            pricePerUnit: parseFloat(item.price_per_unit),
            totalPrice: parseFloat(item.total_price),
          })) || [],
      })) || []
    );
  }

  async savePurchase(purchase: Purchase): Promise<boolean> {
    try {
      // Insertar la compra
      const { error: purchaseError } = await this.supabase
        .from("purchases")
        .insert({
          id: purchase.id,
          week_id: purchase.weekId,
          total_cost: purchase.totalCost,
          purchase_date: purchase.date.toISOString(),
        });

      if (purchaseError) throw purchaseError;

      // Insertar los items
      if (purchase.items && purchase.items.length > 0) {
        const items = purchase.items.map((item) => ({
          purchase_id: purchase.id,
          ingredient_id: item.ingredientId,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          price_per_unit: item.pricePerUnit,
          total_price: item.totalPrice,
        }));

        const { error: itemsError } = await this.supabase
          .from("purchase_items")
          .insert(items);

        if (itemsError) throw itemsError;
      }

      return true;
    } catch (error) {
      console.error("Error saving purchase:", error);
      return false;
    }
  }

  // ============================================================================
  // MENÚS PREDEFINIDOS
  // ============================================================================

  async getPredefinedMenus(): Promise<PredefinedMenu[]> {
    const { data: menus, error } = await this.supabase
      .from("predefined_menus")
      .select(
        `
        *,
        predefined_menu_dishes (
          day_of_week,
          meal_order,
          dish_id,
          dishes (*)
        )
      `
      )
      .order("name");

    if (error) {
      console.error("Error fetching predefined menus:", error);
      return [];
    }

    return (
      menus?.map((menu) => {
        const days: { [day: string]: Dish[] } = {};

        // Agrupar platos por día
        menu.predefined_menu_dishes?.forEach((menuDish: any) => {
          if (!days[menuDish.day_of_week]) {
            days[menuDish.day_of_week] = [];
          }

          if (menuDish.dishes) {
            days[menuDish.day_of_week].push({
              id: menuDish.dishes.id,
              name: menuDish.dishes.name,
              category: menuDish.dishes.category,
              servings: menuDish.dishes.servings,
              ingredients: [], // Se cargarían por separado si es necesario
            });
          }
        });

        return {
          id: menu.id,
          name: menu.name,
          days,
          created_at: new Date(menu.created_at),
          updated_at: new Date(menu.updated_at),
        };
      }) || []
    );
  }

  async savePredefinedMenu(menu: PredefinedMenu): Promise<boolean> {
    try {
      // Insertar o actualizar el menú predefinido
      const { error: menuError } = await this.supabase
        .from("predefined_menus")
        .upsert({
          id: menu.id,
          name: menu.name,
        });

      if (menuError) throw menuError;

      // Eliminar platos existentes
      await this.supabase
        .from("predefined_menu_dishes")
        .delete()
        .eq("predefined_menu_id", menu.id);

      // Insertar nuevos platos
      const menuDishes: any[] = [];

      Object.entries(menu.days).forEach(([day, dishes]) => {
        dishes.forEach((dish, index) => {
          menuDishes.push({
            predefined_menu_id: menu.id,
            day_of_week: day,
            dish_id: dish.id,
            meal_order: index + 1,
          });
        });
      });

      if (menuDishes.length > 0) {
        const { error: dishesError } = await this.supabase
          .from("predefined_menu_dishes")
          .insert(menuDishes);

        if (dishesError) throw dishesError;
      }

      return true;
    } catch (error) {
      console.error("Error saving predefined menu:", error);
      return false;
    }
  }
}

import { Injectable } from "@angular/core";
import { WeeklyMenu } from "../models/interfaces";
import { SupabaseService } from "./supabase.service";

@Injectable({ providedIn: "root" })
export class WeeklyMenuService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Obtiene un menú semanal por semana
   */
  async getMenuByWeek(week: string): Promise<WeeklyMenu | null> {
    return await this.supabaseService.getWeeklyMenuByWeek(week);
  }

  /**
   * Obtiene un menú semanal por ID
   */
  async getMenu(id: string): Promise<WeeklyMenu | null> {
    const menus = await this.supabaseService.getWeeklyMenus();
    return menus.find((menu) => menu.id === id) || null;
  }

  /**
   * Guarda un menú semanal
   */
  async saveMenu(menu: WeeklyMenu): Promise<boolean> {
    return await this.supabaseService.saveWeeklyMenu(menu);
  }

  /**
   * Obtiene todos los menús semanales
   */
  async getAllMenus(): Promise<WeeklyMenu[]> {
    return await this.supabaseService.getWeeklyMenus();
  }

  /**
   * Elimina un menú semanal (implementación futura si es necesaria)
   */
  async deleteMenu(id: string): Promise<boolean> {
    // TODO: Implementar eliminación en SupabaseService si es necesario
    console.warn("Delete menu not implemented yet in Supabase service");
    return false;
  }
}

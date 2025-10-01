import { Injectable } from "@angular/core";
import { SupabaseService, PredefinedMenu } from "./supabase.service";

@Injectable({ providedIn: "root" })
export class PredefinedMenuService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Obtiene un menú predefinido por ID
   */
  async getMenu(id: string): Promise<PredefinedMenu | null> {
    const menus = await this.supabaseService.getPredefinedMenus();
    return menus.find((menu) => menu.id === id) || null;
  }

  /**
   * Guarda un menú predefinido
   */
  async saveMenu(menu: PredefinedMenu): Promise<boolean> {
    return await this.supabaseService.savePredefinedMenu(menu);
  }

  /**
   * Obtiene todos los menús predefinidos
   */
  async getAllMenus(): Promise<PredefinedMenu[]> {
    return await this.supabaseService.getPredefinedMenus();
  }

  /**
   * Elimina un menú predefinido (implementación futura si es necesaria)
   */
  async deleteMenu(id: string): Promise<boolean> {
    // TODO: Implementar eliminación en SupabaseService si es necesario
    console.warn(
      "Delete predefined menu not implemented yet in Supabase service"
    );
    return false;
  }
}

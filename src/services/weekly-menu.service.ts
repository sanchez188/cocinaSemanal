import { Injectable } from "@angular/core";
import { CocinaSemanalDB, WeeklyMenu } from "./db.service";

@Injectable({ providedIn: "root" })
export class WeeklyMenuService {
  constructor(private db: CocinaSemanalDB) {}

  async getMenu(id: string): Promise<WeeklyMenu | undefined> {
    return this.db.weeklyMenus.get(id);
  }

  async saveMenu(menu: WeeklyMenu): Promise<void> {
    await this.db.weeklyMenus.put(menu);
  }

  async getAllMenus(): Promise<WeeklyMenu[]> {
    return this.db.weeklyMenus.toArray();
  }

  async deleteMenu(id: string): Promise<void> {
    await this.db.weeklyMenus.delete(id);
  }
}

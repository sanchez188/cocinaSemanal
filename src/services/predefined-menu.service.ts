import { Injectable } from "@angular/core";
import { CocinaSemanalDB, PredefinedMenuWeek } from "./db.service";

@Injectable({ providedIn: "root" })
export class PredefinedMenuService {
  constructor(private db: CocinaSemanalDB) {}

  async getMenu(id: string): Promise<PredefinedMenuWeek | undefined> {
    return this.db.predefinedMenus.get(id);
  }

  async saveMenu(menu: PredefinedMenuWeek): Promise<void> {
    await this.db.predefinedMenus.put(menu);
  }

  async getAllMenus(): Promise<PredefinedMenuWeek[]> {
    return this.db.predefinedMenus.toArray();
  }

  async deleteMenu(id: string): Promise<void> {
    await this.db.predefinedMenus.delete(id);
  }
}

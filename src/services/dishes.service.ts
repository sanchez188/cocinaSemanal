import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Dish } from '../models/interfaces';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class DishesService {
  private db = inject(DatabaseService);
  private dishesSubject = new BehaviorSubject<Dish[]>([]);
  public dishes$ = this.dishesSubject.asObservable();

  constructor() {
    this.loadDishes();
  }

  private async loadDishes(): Promise<void> {
    try {
      const dishes = await this.db.dishes.toArray();
      this.dishesSubject.next(dishes);
    } catch (error) {
      console.error('Error loading dishes:', error);
    }
  }

  async getDishes(): Promise<Dish[]> {
    return await this.db.dishes.toArray();
  }

  async getDishById(id: string): Promise<Dish | undefined> {
    return await this.db.dishes.get(id);
  }

  async addDish(dish: Dish): Promise<void> {
    try {
      await this.db.dishes.add(dish);
      await this.loadDishes();
    } catch (error) {
      console.error('Error adding dish:', error);
    }
  }

  async updateDish(dish: Dish): Promise<void> {
    try {
      await this.db.dishes.put(dish);
      await this.loadDishes();
    } catch (error) {
      console.error('Error updating dish:', error);
    }
  }

  async removeDish(id: string): Promise<void> {
    try {
      await this.db.dishes.delete(id);
      await this.loadDishes();
    } catch (error) {
      console.error('Error removing dish:', error);
    }
  }

  async getDishesByCategory(category: string): Promise<Dish[]> {
    return await this.db.dishes.where('category').equals(category).toArray();
  }

  // Sync method for compatibility
  getDishesSync(): Dish[] {
    return this.dishesSubject.value;
  }

  getDishByIdSync(id: string): Dish | undefined {
    return this.dishesSubject.value.find(dish => dish.id === id);
  }
}
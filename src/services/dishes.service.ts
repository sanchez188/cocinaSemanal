import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Dish } from '../models/interfaces';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class DishesService {
  private dishesSubject = new BehaviorSubject<Dish[]>([]);
  public dishes$ = this.dishesSubject.asObservable();

  constructor(private storageService: StorageService) {
    this.loadDishes();
  }

  private loadDishes(): void {
    const dishes = this.storageService.getItem<Dish[]>('dishes') || [];
    this.dishesSubject.next(dishes);
  }

  private saveDishes(): void {
    this.storageService.setItem('dishes', this.dishesSubject.value);
  }

  getDishes(): Dish[] {
    return this.dishesSubject.value;
  }

  getDishById(id: string): Dish | undefined {
    return this.dishesSubject.value.find(dish => dish.id === id);
  }

  addDish(dish: Dish): void {
    const currentDishes = this.dishesSubject.value;
    currentDishes.push(dish);
    this.dishesSubject.next([...currentDishes]);
    this.saveDishes();
  }

  updateDish(dish: Dish): void {
    const currentDishes = this.dishesSubject.value;
    const index = currentDishes.findIndex(d => d.id === dish.id);
    
    if (index !== -1) {
      currentDishes[index] = dish;
      this.dishesSubject.next([...currentDishes]);
      this.saveDishes();
    }
  }

  removeDish(id: string): void {
    const currentDishes = this.dishesSubject.value.filter(dish => dish.id !== id);
    this.dishesSubject.next(currentDishes);
    this.saveDishes();
  }

  getDishesByCategory(category: string): Dish[] {
    return this.dishesSubject.value.filter(dish => dish.category === category);
  }
}
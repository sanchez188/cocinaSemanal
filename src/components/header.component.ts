import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
      <div class="container mx-auto px-4 py-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <span class="text-2xl">🍽️</span>
            </div>
            <div>
              <h1 class="text-2xl font-bold">MealPlanner</h1>
              <p class="text-green-100 text-sm">Planifica y controla tus comidas semanales</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent { }
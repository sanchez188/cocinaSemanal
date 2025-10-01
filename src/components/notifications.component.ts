import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  NotificationService,
  NotificationMessage,
} from "../services/notification.service";

@Component({
  selector: "app-notifications",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-50 space-y-2">
      @for (notification of notificationService.notifications(); track
      notification.id) {
      <div
        [ngClass]="getNotificationClass(notification.type)"
        class="max-w-sm w-full shadow-lg rounded-lg pointer-events-auto flex transform transition-all duration-300 ease-in-out"
      >
        <div class="flex-1 w-0 p-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <span
                [innerHTML]="getIcon(notification.type)"
                class="text-xl"
              ></span>
            </div>
            <div class="ml-3 w-0 flex-1 pt-0.5">
              <p class="text-sm font-medium text-gray-900">
                {{ notification.message }}
              </p>
            </div>
            <div class="ml-4 flex-shrink-0 flex">
              <button
                (click)="
                  notificationService.removeNotification(notification.id)
                "
                class="rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <span class="sr-only">Cerrar</span>
                <span class="text-xl">×</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .notification-success {
        background-color: #f0f9ff;
        border: 1px solid #a7f3d0;
      }
      .notification-error {
        background-color: #fef2f2;
        border: 1px solid #fca5a5;
      }
      .notification-info {
        background-color: #eff6ff;
        border: 1px solid #93c5fd;
      }
      .notification-warning {
        background-color: #fffbeb;
        border: 1px solid #fcd34d;
      }
    `,
  ],
})
export class NotificationsComponent {
  constructor(public notificationService: NotificationService) {}

  getNotificationClass(type: string): { [key: string]: boolean } {
    return {
      "notification-success": type === "success",
      "notification-error": type === "error",
      "notification-info": type === "info",
      "notification-warning": type === "warning",
    };
  }

  getIcon(type: string): string {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "info":
        return "ℹ️";
      case "warning":
        return "⚠️";
      default:
        return "ℹ️";
    }
  }
}

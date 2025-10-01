import { Injectable, signal } from "@angular/core";

export interface NotificationMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: "root",
})
export class NotificationService {
  private notificationsSignal = signal<NotificationMessage[]>([]);
  public notifications = this.notificationsSignal.asReadonly();

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private addNotification(
    type: NotificationMessage["type"],
    message: string,
    duration = 4000
  ): void {
    const notification: NotificationMessage = {
      id: this.generateId(),
      type,
      message,
      duration,
    };

    const current = this.notificationsSignal();
    this.notificationsSignal.set([...current, notification]);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, duration);
    }
  }

  showSuccess(message: string, duration?: number): void {
    this.addNotification("success", message, duration);
  }

  showError(message: string, duration?: number): void {
    this.addNotification("error", message, duration);
  }

  showInfo(message: string, duration?: number): void {
    this.addNotification("info", message, duration);
  }

  showWarning(message: string, duration?: number): void {
    this.addNotification("warning", message, duration);
  }

  removeNotification(id: string): void {
    const current = this.notificationsSignal();
    this.notificationsSignal.set(current.filter((n) => n.id !== id));
  }

  clearAll(): void {
    this.notificationsSignal.set([]);
  }
}

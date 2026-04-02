import { Todo } from '../types';

export const notificationService = {
  async scheduleDueDateNotifications(todos: Todo[]): Promise<void> {
    // Dynamic import to avoid issues in test environment
    try {
      const Notifications = await import('expo-notifications');

      await Notifications.cancelAllScheduledNotificationsAsync();

      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      const today = new Date(now);
      today.setHours(9, 0, 0, 0);

      for (const todo of todos) {
        if (todo.status === 'done' || !todo.dueDate) continue;

        const dueDate = new Date(todo.dueDate);

        if (dueDate <= tomorrow && dueDate > now) {
          const isToday =
            dueDate.getFullYear() === now.getFullYear() &&
            dueDate.getMonth() === now.getMonth() &&
            dueDate.getDate() === now.getDate();

          await Notifications.scheduleNotificationAsync({
            content: {
              title: isToday ? '任务今天到期' : '任务明天到期',
              body: `${todo.title}${todo.assignee ? ` (${todo.assignee})` : ''}`,
              data: { todoId: todo.id },
            },
            trigger: isToday
              ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date: today }
              : { type: Notifications.SchedulableTriggerInputTypes.DATE, date: tomorrow },
          });
        }
      }
    } catch {
      // expo-notifications not available (test env or unsupported platform)
    }
  },

  async cancelAllNotifications(): Promise<void> {
    try {
      const Notifications = await import('expo-notifications');
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch {
      // ignore
    }
  },
};

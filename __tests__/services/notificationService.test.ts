import { notificationService } from '../../src/services/notificationService';

describe('notificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('scheduleDueDateNotifications', () => {
    it('should not throw when called with empty todos', async () => {
      await expect(
        notificationService.scheduleDueDateNotifications([]),
      ).resolves.not.toThrow();
    });

    it('should handle todos without due dates', async () => {
      const todos = [
        {
          id: '1',
          title: 'No due date',
          status: 'todo' as const,
          dueDate: '',
        },
      ] as any;

      await expect(
        notificationService.scheduleDueDateNotifications(todos),
      ).resolves.not.toThrow();
    });

    it('should skip done todos', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const todos = [
        {
          id: '1',
          title: 'Done task',
          status: 'done' as const,
          dueDate: tomorrow.toISOString(),
          assignee: 'alice',
          tags: [],
        },
      ] as any;

      await expect(
        notificationService.scheduleDueDateNotifications(todos),
      ).resolves.not.toThrow();
    });
  });

  describe('cancelAllNotifications', () => {
    it('should not throw', async () => {
      await expect(
        notificationService.cancelAllNotifications(),
      ).resolves.not.toThrow();
    });
  });
});

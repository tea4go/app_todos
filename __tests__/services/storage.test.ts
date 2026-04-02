import { storage } from '../../src/services/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getToken / setToken', () => {
    it('should return null when no token stored', async () => {
      const result = await storage.getToken();
      expect(result).toBeNull();
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('gitee_token');
    });

    it('should store and retrieve a token', async () => {
      await storage.setToken('test-token');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('gitee_token', 'test-token');
    });
  });

  describe('getGistId / setGistId', () => {
    it('should return null when no gist id stored', async () => {
      const result = await storage.getGistId();
      expect(result).toBeNull();
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('gist_id');
    });

    it('should store a gist id', async () => {
      await storage.setGistId('abc123');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('gist_id', 'abc123');
    });
  });

  describe('getTodoData / setTodoData', () => {
    it('should return null when no data stored', async () => {
      const result = await storage.getTodoData();
      expect(result).toBeNull();
    });

    it('should store todo data as JSON string', async () => {
      const data = { team: 'test', members: [], todos: [] };
      await storage.setTodoData(JSON.stringify(data));
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'todo_data',
        JSON.stringify(data),
      );
    });
  });

  describe('getPendingActions / setPendingActions', () => {
    it('should return null when no pending actions', async () => {
      const result = await storage.getPendingActions();
      expect(result).toBeNull();
    });

    it('should store pending actions', async () => {
      await storage.setPendingActions('[]');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('pending_actions', '[]');
    });
  });

  describe('clearAll', () => {
    it('should remove all keys', async () => {
      await storage.clearAll();
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        'gitee_token',
        'gist_id',
        'todo_data',
        'pending_actions',
      ]);
    });
  });
});

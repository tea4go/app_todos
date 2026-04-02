import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TOKEN: 'gitee_token',
  GIST_ID: 'gist_id',
  TODO_DATA: 'todo_data',
  PENDING_ACTIONS: 'pending_actions',
} as const;

export const storage = {
  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.TOKEN);
  },

  async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.TOKEN, token);
  },

  async getGistId(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.GIST_ID);
  },

  async setGistId(id: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.GIST_ID, id);
  },

  async getTodoData(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.TODO_DATA);
  },

  async setTodoData(data: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.TODO_DATA, data);
  },

  async getPendingActions(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.PENDING_ACTIONS);
  },

  async setPendingActions(actions: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.PENDING_ACTIONS, actions);
  },

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  },
};

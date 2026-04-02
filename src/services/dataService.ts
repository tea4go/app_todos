import { TodoData, Todo, PendingAction } from '../types';
import { storage } from './storage';
import { giteeApi } from './giteeApi';
import { v4 as uuidv4 } from 'uuid';

const EMPTY_DATA: TodoData = {
  team: '',
  members: [],
  todos: [],
};

export const dataService = {
  async getLocalData(): Promise<TodoData> {
    const raw = await storage.getTodoData();
    if (!raw) return { ...EMPTY_DATA, members: [], todos: [] };
    try {
      return JSON.parse(raw) as TodoData;
    } catch {
      return { ...EMPTY_DATA, members: [], todos: [] };
    }
  },

  async saveLocalData(data: TodoData): Promise<void> {
    await storage.setTodoData(JSON.stringify(data));
  },

  mergeData(local: TodoData, remote: TodoData): TodoData {
    const mergedTodos = new Map<string, Todo>();

    for (const todo of remote.todos) {
      mergedTodos.set(todo.id, todo);
    }

    for (const todo of local.todos) {
      const existing = mergedTodos.get(todo.id);
      if (!existing || new Date(todo.updatedAt) > new Date(existing.updatedAt)) {
        mergedTodos.set(todo.id, todo);
      }
    }

    return {
      team: remote.team || local.team,
      members: remote.members.length > 0 ? remote.members : local.members,
      todos: Array.from(mergedTodos.values()),
    };
  },

  async syncFromRemote(): Promise<TodoData> {
    const token = await storage.getToken();
    const gistId = await storage.getGistId();
    if (!token || !gistId) {
      throw new Error('未配置 Gitee 令牌或代码片段 ID');
    }

    const remoteData = await giteeApi.fetchGist(gistId, token);
    const localData = await this.getLocalData();
    const merged = this.mergeData(localData, remoteData);
    await this.saveLocalData(merged);
    return merged;
  },

  async syncToRemote(data: TodoData): Promise<TodoData> {
    const token = await storage.getToken();
    const gistId = await storage.getGistId();
    if (!token || !gistId) {
      throw new Error('未配置 Gitee 令牌或代码片段 ID');
    }

    const remoteData = await giteeApi.fetchGist(gistId, token);
    const merged = this.mergeData(data, remoteData);
    await giteeApi.updateGist(gistId, token, merged);
    await this.saveLocalData(merged);
    return merged;
  },

  async addTodo(
    todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Todo> {
    const now = new Date().toISOString();
    const newTodo: Todo = {
      ...todo,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    const data = await this.getLocalData();
    data.todos.push(newTodo);
    await this.saveLocalData(data);

    try {
      const merged = await this.syncToRemote(data);
      const synced = merged.todos.find(t => t.id === newTodo.id);
      if (synced) return synced;
    } catch {
      await this.addPendingAction({
        type: 'create',
        todoId: newTodo.id,
        timestamp: now,
        data: newTodo,
      });
    }

    return newTodo;
  },

  async updateTodo(id: string, updates: Partial<Todo>): Promise<Todo | null> {
    const data = await this.getLocalData();
    const index = data.todos.findIndex(t => t.id === id);
    if (index === -1) return null;

    const updated: Todo = {
      ...data.todos[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    data.todos[index] = updated;
    await this.saveLocalData(data);

    try {
      const merged = await this.syncToRemote(data);
      const synced = merged.todos.find(t => t.id === id);
      if (synced) return synced;
    } catch {
      await this.addPendingAction({
        type: 'update',
        todoId: id,
        timestamp: updated.updatedAt,
        data: updated,
      });
    }

    return updated;
  },

  async deleteTodo(id: string): Promise<boolean> {
    const data = await this.getLocalData();
    const index = data.todos.findIndex(t => t.id === id);
    if (index === -1) return false;

    data.todos.splice(index, 1);
    await this.saveLocalData(data);

    try {
      await this.syncToRemote(data);
    } catch {
      await this.addPendingAction({
        type: 'delete',
        todoId: id,
        timestamp: new Date().toISOString(),
      });
    }

    return true;
  },

  async updateTeamInfo(team: string, members: string[]): Promise<void> {
    const data = await this.getLocalData();
    data.team = team;
    data.members = members;
    await this.saveLocalData(data);

    try {
      await this.syncToRemote(data);
    } catch {
      // will sync later
    }
  },

  async getPendingActions(): Promise<PendingAction[]> {
    const raw = await storage.getPendingActions();
    if (!raw) return [];
    try {
      return JSON.parse(raw) as PendingAction[];
    } catch {
      return [];
    }
  },

  async addPendingAction(action: PendingAction): Promise<void> {
    const actions = await this.getPendingActions();
    actions.push(action);
    await storage.setPendingActions(JSON.stringify(actions));
  },

  async clearPendingActions(): Promise<void> {
    await storage.setPendingActions('[]');
  },

  async processPendingActions(): Promise<void> {
    const actions = await this.getPendingActions();
    if (actions.length === 0) return;

    const data = await this.getLocalData();
    try {
      await this.syncToRemote(data);
      await this.clearPendingActions();
    } catch {
      // Still offline, keep pending actions
    }
  },

  async initGist(teamName: string): Promise<string> {
    const token = await storage.getToken();
    if (!token) throw new Error('未配置 Gitee 令牌');

    const initData: TodoData = {
      team: teamName,
      members: [],
      todos: [],
    };

    const gistId = await giteeApi.createGist(token, initData);
    await storage.setGistId(gistId);
    await this.saveLocalData(initData);
    return gistId;
  },

  filterTodos(data: TodoData, filters: {
    status?: string;
    priority?: string;
    assignee?: string;
    tag?: string;
  }): Todo[] {
    return data.todos.filter(todo => {
      if (filters.status && filters.status !== 'all' && todo.status !== filters.status) {
        return false;
      }
      if (filters.priority && filters.priority !== 'all' && todo.priority !== filters.priority) {
        return false;
      }
      if (filters.assignee && filters.assignee !== 'all' && todo.assignee !== filters.assignee) {
        return false;
      }
      if (filters.tag && filters.tag !== 'all' && !todo.tags.includes(filters.tag)) {
        return false;
      }
      return true;
    });
  },

  sortTodos(todos: Todo[]): Todo[] {
    return [...todos].sort((a, b) => {
      // Done items go to bottom
      if (a.status === 'done' && b.status !== 'done') return 1;
      if (a.status !== 'done' && b.status === 'done') return -1;

      // Higher priority first
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }

      // Earlier due date first
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;

      // Newest first
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  },
};

import { dataService } from '../../src/services/dataService';
import { storage } from '../../src/services/storage';
import { giteeApi } from '../../src/services/giteeApi';
import { TodoData, Todo } from '../../src/types';

jest.mock('../../src/services/storage');
jest.mock('../../src/services/giteeApi');

const makeTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: 'id-1',
  title: '测试任务',
  description: '描述',
  status: 'todo',
  priority: 'medium',
  assignee: 'alice',
  creator: 'bob',
  dueDate: '2026-04-10T00:00:00Z',
  createdAt: '2026-04-02T10:00:00Z',
  updatedAt: '2026-04-02T10:00:00Z',
  tags: [],
  ...overrides,
});

describe('dataService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (storage.getToken as jest.Mock).mockResolvedValue('test-token');
    (storage.getGistId as jest.Mock).mockResolvedValue('gist-123');
  });

  describe('getLocalData', () => {
    it('should return empty data when nothing stored', async () => {
      (storage.getTodoData as jest.Mock).mockResolvedValue(null);
      const data = await dataService.getLocalData();
      expect(data).toEqual({ team: '', members: [], todos: [] });
    });

    it('should parse stored JSON data', async () => {
      const stored: TodoData = {
        team: '团队',
        members: ['alice'],
        todos: [makeTodo()],
      };
      (storage.getTodoData as jest.Mock).mockResolvedValue(JSON.stringify(stored));
      const data = await dataService.getLocalData();
      expect(data).toEqual(stored);
    });

    it('should return empty data on invalid JSON', async () => {
      (storage.getTodoData as jest.Mock).mockResolvedValue('invalid');
      const data = await dataService.getLocalData();
      expect(data).toEqual({ team: '', members: [], todos: [] });
    });
  });

  describe('saveLocalData', () => {
    it('should stringify and save data', async () => {
      const data: TodoData = { team: 'T', members: [], todos: [] };
      await dataService.saveLocalData(data);
      expect(storage.setTodoData).toHaveBeenCalledWith(JSON.stringify(data));
    });
  });

  describe('mergeData', () => {
    it('should merge local and remote, keeping newer versions', () => {
      const localTodo = makeTodo({
        id: '1',
        updatedAt: '2026-04-02T12:00:00Z',
        title: '本地更新',
      });
      const remoteTodo = makeTodo({
        id: '1',
        updatedAt: '2026-04-02T10:00:00Z',
        title: '远程旧版',
      });
      const localOnly = makeTodo({ id: '2', title: '仅本地' });
      const remoteOnly = makeTodo({ id: '3', title: '仅远程' });

      const local: TodoData = {
        team: '本地团队',
        members: ['alice'],
        todos: [localTodo, localOnly],
      };
      const remote: TodoData = {
        team: '远程团队',
        members: ['bob'],
        todos: [remoteTodo, remoteOnly],
      };

      const merged = dataService.mergeData(local, remote);

      expect(merged.team).toBe('远程团队');
      expect(merged.members).toEqual(['bob']);
      expect(merged.todos).toHaveLength(3);

      const todo1 = merged.todos.find(t => t.id === '1');
      expect(todo1?.title).toBe('本地更新'); // local is newer
    });

    it('should keep remote when remote is newer', () => {
      const localTodo = makeTodo({
        id: '1',
        updatedAt: '2026-04-02T10:00:00Z',
        title: '本地旧版',
      });
      const remoteTodo = makeTodo({
        id: '1',
        updatedAt: '2026-04-02T12:00:00Z',
        title: '远程更新',
      });

      const local: TodoData = { team: '', members: [], todos: [localTodo] };
      const remote: TodoData = { team: '', members: [], todos: [remoteTodo] };

      const merged = dataService.mergeData(local, remote);
      expect(merged.todos[0].title).toBe('远程更新');
    });
  });

  describe('addTodo', () => {
    it('should add a todo locally and sync to remote', async () => {
      const existing: TodoData = { team: 'T', members: [], todos: [] };
      (storage.getTodoData as jest.Mock).mockResolvedValue(JSON.stringify(existing));
      (giteeApi.fetchGist as jest.Mock).mockResolvedValue(existing);
      (giteeApi.updateGist as jest.Mock).mockResolvedValue(undefined);

      const todo = await dataService.addTodo({
        title: '新任务',
        description: '',
        status: 'todo',
        priority: 'high',
        assignee: 'alice',
        creator: 'bob',
        dueDate: '',
        tags: [],
      });

      expect(todo.title).toBe('新任务');
      expect(todo.id).toBeDefined();
      expect(todo.createdAt).toBeDefined();
      expect(todo.updatedAt).toBeDefined();
      expect(storage.setTodoData).toHaveBeenCalled();
    });

    it('should add pending action when sync fails', async () => {
      const existing: TodoData = { team: 'T', members: [], todos: [] };
      (storage.getTodoData as jest.Mock).mockResolvedValue(JSON.stringify(existing));
      (storage.getPendingActions as jest.Mock).mockResolvedValue('[]');
      (giteeApi.fetchGist as jest.Mock).mockRejectedValue(new Error('network'));

      const todo = await dataService.addTodo({
        title: '离线任务',
        description: '',
        status: 'todo',
        priority: 'medium',
        assignee: '',
        creator: 'alice',
        dueDate: '',
        tags: [],
      });

      expect(todo.title).toBe('离线任务');
      expect(storage.setPendingActions).toHaveBeenCalled();
    });
  });

  describe('updateTodo', () => {
    it('should update an existing todo', async () => {
      const todo = makeTodo();
      const existing: TodoData = { team: 'T', members: [], todos: [todo] };
      (storage.getTodoData as jest.Mock).mockResolvedValue(JSON.stringify(existing));
      (giteeApi.fetchGist as jest.Mock).mockResolvedValue(existing);
      (giteeApi.updateGist as jest.Mock).mockResolvedValue(undefined);

      const updated = await dataService.updateTodo('id-1', { title: '更新标题' });
      expect(updated?.title).toBe('更新标题');
    });

    it('should return null for non-existent todo', async () => {
      const existing: TodoData = { team: 'T', members: [], todos: [] };
      (storage.getTodoData as jest.Mock).mockResolvedValue(JSON.stringify(existing));

      const result = await dataService.updateTodo('nonexistent', { title: 'x' });
      expect(result).toBeNull();
    });
  });

  describe('deleteTodo', () => {
    it('should delete an existing todo', async () => {
      const todo = makeTodo();
      const existing: TodoData = { team: 'T', members: [], todos: [todo] };
      (storage.getTodoData as jest.Mock).mockResolvedValue(JSON.stringify(existing));
      (giteeApi.fetchGist as jest.Mock).mockResolvedValue(existing);
      (giteeApi.updateGist as jest.Mock).mockResolvedValue(undefined);

      const result = await dataService.deleteTodo('id-1');
      expect(result).toBe(true);
    });

    it('should return false for non-existent todo', async () => {
      const existing: TodoData = { team: 'T', members: [], todos: [] };
      (storage.getTodoData as jest.Mock).mockResolvedValue(JSON.stringify(existing));

      const result = await dataService.deleteTodo('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('filterTodos', () => {
    const todos = [
      makeTodo({ id: '1', status: 'todo', priority: 'high', assignee: 'alice', tags: ['设计'] }),
      makeTodo({ id: '2', status: 'in_progress', priority: 'medium', assignee: 'bob', tags: ['开发'] }),
      makeTodo({ id: '3', status: 'done', priority: 'low', assignee: 'alice', tags: ['测试'] }),
    ];
    const data: TodoData = { team: 'T', members: ['alice', 'bob'], todos };

    it('should filter by status', () => {
      const result = dataService.filterTodos(data, { status: 'todo' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should filter by priority', () => {
      const result = dataService.filterTodos(data, { priority: 'high' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should filter by assignee', () => {
      const result = dataService.filterTodos(data, { assignee: 'bob' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('should filter by tag', () => {
      const result = dataService.filterTodos(data, { tag: '测试' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('3');
    });

    it('should return all when filter is "all"', () => {
      const result = dataService.filterTodos(data, { status: 'all' });
      expect(result).toHaveLength(3);
    });

    it('should combine multiple filters', () => {
      const result = dataService.filterTodos(data, { status: 'todo', priority: 'high' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });

  describe('sortTodos', () => {
    it('should put done items at bottom', () => {
      const todos = [
        makeTodo({ id: '1', status: 'done', priority: 'high' }),
        makeTodo({ id: '2', status: 'todo', priority: 'low' }),
      ];
      const sorted = dataService.sortTodos(todos);
      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('1');
    });

    it('should sort by priority when status is same', () => {
      const todos = [
        makeTodo({ id: '1', status: 'todo', priority: 'low' }),
        makeTodo({ id: '2', status: 'todo', priority: 'high' }),
        makeTodo({ id: '3', status: 'todo', priority: 'medium' }),
      ];
      const sorted = dataService.sortTodos(todos);
      expect(sorted[0].priority).toBe('high');
      expect(sorted[1].priority).toBe('medium');
      expect(sorted[2].priority).toBe('low');
    });

    it('should sort by due date when priority is same', () => {
      const todos = [
        makeTodo({ id: '1', priority: 'medium', dueDate: '2026-04-20T00:00:00Z' }),
        makeTodo({ id: '2', priority: 'medium', dueDate: '2026-04-05T00:00:00Z' }),
      ];
      const sorted = dataService.sortTodos(todos);
      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('1');
    });
  });

  describe('initGist', () => {
    it('should create gist and save id', async () => {
      (storage.getToken as jest.Mock).mockResolvedValue('test-token');
      (giteeApi.createGist as jest.Mock).mockResolvedValue('new-gist-id');

      const id = await dataService.initGist('新团队');

      expect(id).toBe('new-gist-id');
      expect(storage.setGistId).toHaveBeenCalledWith('new-gist-id');
      expect(giteeApi.createGist).toHaveBeenCalledWith(
        'test-token',
        expect.objectContaining({ team: '新团队', members: [], todos: [] }),
      );
    });

    it('should throw when no token', async () => {
      (storage.getToken as jest.Mock).mockResolvedValue(null);
      await expect(dataService.initGist('团队')).rejects.toThrow('未配置 Gitee 令牌');
    });
  });

  describe('pending actions', () => {
    it('should get empty array when nothing stored', async () => {
      (storage.getPendingActions as jest.Mock).mockResolvedValue(null);
      const actions = await dataService.getPendingActions();
      expect(actions).toEqual([]);
    });

    it('should add and retrieve pending actions', async () => {
      (storage.getPendingActions as jest.Mock).mockResolvedValue('[]');
      await dataService.addPendingAction({
        type: 'create',
        todoId: '1',
        timestamp: '2026-04-02T10:00:00Z',
      });
      expect(storage.setPendingActions).toHaveBeenCalled();
    });

    it('should clear pending actions', async () => {
      await dataService.clearPendingActions();
      expect(storage.setPendingActions).toHaveBeenCalledWith('[]');
    });
  });
});

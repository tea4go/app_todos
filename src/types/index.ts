export type TodoStatus = 'todo' | 'in_progress' | 'done';
export type TodoPriority = 'low' | 'medium' | 'high';

export interface Todo {
  id: string;
  title: string;
  description: string;
  status: TodoStatus;
  priority: TodoPriority;
  assignee: string;
  creator: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface TodoData {
  team: string;
  members: string[];
  todos: Todo[];
}

export type PendingActionType = 'create' | 'update' | 'delete';

export interface PendingAction {
  type: PendingActionType;
  todoId: string;
  timestamp: string;
  data?: Todo;
}

export interface FilterState {
  status: TodoStatus | 'all';
  priority: TodoPriority | 'all';
  assignee: string;
  tag: string;
}

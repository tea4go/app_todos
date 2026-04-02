import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TaskCard from '../../src/components/TaskCard';
import { Todo } from '../../src/types';

const mockTodo: Todo = {
  id: 'test-id',
  title: '测试任务',
  description: '任务描述',
  status: 'todo',
  priority: 'high',
  assignee: 'alice',
  creator: 'bob',
  dueDate: '2026-04-10T00:00:00Z',
  createdAt: '2026-04-02T10:00:00Z',
  updatedAt: '2026-04-02T10:00:00Z',
  tags: ['设计', 'UI'],
};

describe('TaskCard', () => {
  it('should render todo title', () => {
    const { getByText } = render(
      <TaskCard todo={mockTodo} onPress={jest.fn()} />,
    );
    expect(getByText('测试任务')).toBeTruthy();
  });

  it('should render description', () => {
    const { getByText } = render(
      <TaskCard todo={mockTodo} onPress={jest.fn()} />,
    );
    expect(getByText('任务描述')).toBeTruthy();
  });

  it('should render assignee', () => {
    const { getByText } = render(
      <TaskCard todo={mockTodo} onPress={jest.fn()} />,
    );
    expect(getByText('@alice')).toBeTruthy();
  });

  it('should render status badge', () => {
    const { getByText } = render(
      <TaskCard todo={mockTodo} onPress={jest.fn()} />,
    );
    expect(getByText('待办')).toBeTruthy();
  });

  it('should render tags', () => {
    const { getByText } = render(
      <TaskCard todo={mockTodo} onPress={jest.fn()} />,
    );
    expect(getByText('设计')).toBeTruthy();
    expect(getByText('UI')).toBeTruthy();
  });

  it('should call onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <TaskCard todo={mockTodo} onPress={onPress} />,
    );
    fireEvent.press(getByTestId('task-card-test-id'));
    expect(onPress).toHaveBeenCalledWith(mockTodo);
  });

  it('should render in_progress status correctly', () => {
    const inProgressTodo = { ...mockTodo, status: 'in_progress' as const };
    const { getByText } = render(
      <TaskCard todo={inProgressTodo} onPress={jest.fn()} />,
    );
    expect(getByText('进行中')).toBeTruthy();
  });

  it('should render done status correctly', () => {
    const doneTodo = { ...mockTodo, status: 'done' as const };
    const { getByText } = render(
      <TaskCard todo={doneTodo} onPress={jest.fn()} />,
    );
    expect(getByText('已完成')).toBeTruthy();
  });

  it('should not render description when empty', () => {
    const noDescTodo = { ...mockTodo, description: '' };
    const { queryByText } = render(
      <TaskCard todo={noDescTodo} onPress={jest.fn()} />,
    );
    expect(queryByText('任务描述')).toBeNull();
  });
});

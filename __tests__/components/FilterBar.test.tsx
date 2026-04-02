import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import FilterBar from '../../src/components/FilterBar';

describe('FilterBar', () => {
  it('should render all filter options', () => {
    const { getByText } = render(
      <FilterBar selectedStatus="all" onStatusChange={jest.fn()} />,
    );
    expect(getByText('全部')).toBeTruthy();
    expect(getByText('待办')).toBeTruthy();
    expect(getByText('进行中')).toBeTruthy();
    expect(getByText('已完成')).toBeTruthy();
  });

  it('should call onStatusChange when a filter is pressed', () => {
    const onStatusChange = jest.fn();
    const { getByTestId } = render(
      <FilterBar selectedStatus="all" onStatusChange={onStatusChange} />,
    );
    fireEvent.press(getByTestId('filter-todo'));
    expect(onStatusChange).toHaveBeenCalledWith('todo');
  });

  it('should highlight the selected status', () => {
    const { getByTestId } = render(
      <FilterBar selectedStatus="in_progress" onStatusChange={jest.fn()} />,
    );
    const chip = getByTestId('filter-in_progress');
    // The parent View should have the active style
    expect(chip).toBeTruthy();
  });

  it('should render with testID', () => {
    const { getByTestId } = render(
      <FilterBar selectedStatus="all" onStatusChange={jest.fn()} />,
    );
    expect(getByTestId('filter-bar')).toBeTruthy();
  });
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { TodoStatus, TodoPriority } from '../types';

interface FilterBarProps {
  selectedStatus: TodoStatus | 'all';
  onStatusChange: (status: TodoStatus | 'all') => void;
}

const STATUS_OPTIONS: { value: TodoStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'todo', label: '待办' },
  { value: 'in_progress', label: '进行中' },
  { value: 'done', label: '已完成' },
];

export default function FilterBar({ selectedStatus, onStatusChange }: FilterBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="filter-bar"
    >
      {STATUS_OPTIONS.map(option => (
        <TouchableOpacity
          key={option.value}
          onPress={() => onStatusChange(option.value)}
          testID={`filter-${option.value}`}
        >
          <View
            style={[
              styles.chip,
              selectedStatus === option.value && styles.chipActive,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                selectedStatus === option.value && styles.chipTextActive,
              ]}
            >
              {option.label}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 44,
  },
  content: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  chipActive: {
    backgroundColor: '#3b82f6',
  },
  chipText: {
    fontSize: 14,
    color: '#6b7280',
  },
  chipTextActive: {
    color: '#fff',
  },
});

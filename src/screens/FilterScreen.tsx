import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import TaskCard from '../components/TaskCard';
import { dataService } from '../services/dataService';
import { Todo, TodoStatus, TodoPriority, FilterState } from '../types';

type RootStackParamList = {
  FilterView: undefined;
  TaskDetail: { todoId?: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'FilterView'>;

export default function FilterScreen({ navigation }: Props) {
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    priority: 'all',
    assignee: 'all',
    tag: 'all',
  });
  const [todos, setTodos] = useState<Todo[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [members, setMembers] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    const data = await dataService.getLocalData();
    setMembers(data.members);

    // Collect all unique tags
    const tags = new Set<string>();
    data.todos.forEach(t => t.tags.forEach(tag => tags.add(tag)));
    setAllTags(Array.from(tags));

    // Apply filters
    const filtered = dataService.filterTodos(data, {
      status: filters.status,
      priority: filters.priority,
      assignee: filters.assignee,
      tag: filters.tag,
    });
    setTodos(dataService.sortTodos(filtered));
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateFilter = useCallback(
    (key: keyof FilterState, value: string) => {
      setFilters(prev => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleTodoPress = useCallback(
    (todo: Todo) => {
      navigation.navigate('TaskDetail', { todoId: todo.id });
    },
    [navigation],
  );

  const renderFilterRow = (
    label: string,
    options: { value: string; label: string }[],
    filterKey: keyof FilterState,
  ) => (
    <View style={styles.filterRow}>
      <Text style={styles.filterLabel}>{label}</Text>
      <View style={styles.chipGroup}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => updateFilter(filterKey, opt.value)}
            testID={`filter-${filterKey}-${opt.value}`}
          >
            <View
              style={[
                styles.chip,
                filters[filterKey] === opt.value && styles.chipActive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  filters[filterKey] === opt.value && styles.chipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const statusOptions = [
    { value: 'all', label: '全部' },
    { value: 'todo', label: '待办' },
    { value: 'in_progress', label: '进行中' },
    { value: 'done', label: '已完成' },
  ];

  const priorityOptions = [
    { value: 'all', label: '全部' },
    { value: 'high', label: '高' },
    { value: 'medium', label: '中' },
    { value: 'low', label: '低' },
  ];

  const memberOptions = [
    { value: 'all', label: '全部' },
    ...members.map(m => ({ value: m, label: m })),
  ];

  const tagOptions = [
    { value: 'all', label: '全部' },
    ...allTags.map(t => ({ value: t, label: t })),
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.filters}>
        {renderFilterRow('状态', statusOptions, 'status')}
        {renderFilterRow('优先级', priorityOptions, 'priority')}
        {members.length > 0 && renderFilterRow('负责人', memberOptions, 'assignee')}
        {allTags.length > 0 && renderFilterRow('标签', tagOptions, 'tag')}
      </View>
      <FlatList
        data={todos}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <TaskCard todo={item} onPress={handleTodoPress} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>没有匹配的任务</Text>
          </View>
        }
        testID="filter-results"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  filters: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  chipActive: {
    backgroundColor: '#3b82f6',
  },
  chipText: {
    fontSize: 13,
    color: '#6b7280',
  },
  chipTextActive: {
    color: '#fff',
  },
  list: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
  },
});

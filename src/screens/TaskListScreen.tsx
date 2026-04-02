import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import TaskCard from '../components/TaskCard';
import FilterBar from '../components/FilterBar';
import { dataService } from '../services/dataService';
import { notificationService } from '../services/notificationService';
import { Todo, TodoStatus } from '../types';

type RootStackParamList = {
  TaskList: undefined;
  TaskDetail: { todoId?: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'TaskList'>;

export default function TaskListScreen({ navigation }: Props) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [statusFilter, setStatusFilter] = useState<TodoStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);

  const loadTodos = useCallback(async () => {
    const data = await dataService.getLocalData();
    const filtered = dataService.filterTodos(data, { status: statusFilter });
    const sorted = dataService.sortTodos(filtered);
    setTodos(sorted);

    // Schedule notifications
    notificationService.scheduleDueDateNotifications(data.todos);
  }, [statusFilter]);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await dataService.syncFromRemote();
      setOffline(false);
    } catch {
      setOffline(true);
    }
    await loadTodos();
    setRefreshing(false);
  }, [loadTodos]);

  const handleStatusFilter = useCallback((status: TodoStatus | 'all') => {
    setStatusFilter(status);
  }, []);

  const handleTodoPress = useCallback(
    (todo: Todo) => {
      navigation.navigate('TaskDetail', { todoId: todo.id });
    },
    [navigation],
  );

  const handleAdd = useCallback(() => {
    navigation.navigate('TaskDetail', {});
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {offline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>离线模式</Text>
        </View>
      )}
      <FilterBar selectedStatus={statusFilter} onStatusChange={handleStatusFilter} />
      <FlatList
        data={todos}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <TaskCard todo={item} onPress={handleTodoPress} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>暂无待办事项</Text>
          </View>
        }
        testID="task-list"
      />
      <TouchableOpacity style={styles.fab} onPress={handleAdd} testID="add-todo-button">
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  offlineBanner: {
    backgroundColor: '#fbbf24',
    paddingVertical: 4,
    alignItems: 'center',
  },
  offlineText: {
    fontSize: 12,
    color: '#78350f',
  },
  list: {
    paddingTop: 8,
    paddingBottom: 80,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
    lineHeight: 32,
  },
});

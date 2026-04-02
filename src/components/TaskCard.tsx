import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Todo } from '../types';

interface TaskCardProps {
  todo: Todo;
  onPress: (todo: Todo) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
};

const STATUS_LABELS: Record<string, string> = {
  todo: '待办',
  in_progress: '进行中',
  done: '已完成',
};

export default function TaskCard({ todo, onPress }: TaskCardProps) {
  const isDone = todo.status === 'done';

  return (
    <TouchableOpacity onPress={() => onPress(todo)} testID={`task-card-${todo.id}`}>
      <View style={[styles.card, isDone && styles.cardDone]}>
        <View style={[styles.priorityBar, { backgroundColor: PRIORITY_COLORS[todo.priority] }]} />
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, isDone && styles.titleDone]} numberOfLines={1}>
              {todo.title}
            </Text>
            <View style={[styles.statusBadge, isDone && styles.statusBadgeDone]}>
              <Text style={[styles.statusText, isDone && styles.statusTextDone]}>
                {STATUS_LABELS[todo.status]}
              </Text>
            </View>
          </View>
          {todo.description ? (
            <Text style={styles.description} numberOfLines={1}>
              {todo.description}
            </Text>
          ) : null}
          <View style={styles.footer}>
            {todo.assignee ? (
              <Text style={styles.meta}>@{todo.assignee}</Text>
            ) : null}
            {todo.dueDate ? (
              <Text style={styles.meta}>
                {new Date(todo.dueDate).toLocaleDateString('zh-CN')}
              </Text>
            ) : null}
          </View>
          {todo.tags.length > 0 ? (
            <View style={styles.tags}>
              {todo.tags.map(tag => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  cardDone: {
    opacity: 0.6,
  },
  priorityBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  statusBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusBadgeDone: {
    backgroundColor: '#f0fdf4',
  },
  statusText: {
    fontSize: 12,
    color: '#3b82f6',
  },
  statusTextDone: {
    color: '#22c55e',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
  },
  meta: {
    fontSize: 12,
    color: '#9ca3af',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  tag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#6b7280',
  },
});

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { dataService } from '../services/dataService';
import { Todo, TodoStatus, TodoPriority } from '../types';

type RootStackParamList = {
  TaskList: undefined;
  TaskDetail: { todoId?: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'TaskDetail'>;

const STATUS_OPTIONS: { value: TodoStatus; label: string }[] = [
  { value: 'todo', label: '待办' },
  { value: 'in_progress', label: '进行中' },
  { value: 'done', label: '已完成' },
];

const PRIORITY_OPTIONS: { value: TodoPriority; label: string }[] = [
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
];

export default function TaskDetailScreen({ navigation, route }: Props) {
  const todoId = route.params?.todoId;
  const isNew = !todoId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TodoStatus>('todo');
  const [priority, setPriority] = useState<TodoPriority>('medium');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [members, setMembers] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await dataService.getLocalData();
      setMembers(data.members);

      if (todoId) {
        const todo = data.todos.find(t => t.id === todoId);
        if (todo) {
          setTitle(todo.title);
          setDescription(todo.description);
          setStatus(todo.status);
          setPriority(todo.priority);
          setAssignee(todo.assignee);
          setDueDate(todo.dueDate ? todo.dueDate.split('T')[0] : '');
          setTagsInput(todo.tags.join(', '));
        }
      }
    };
    load();
  }, [todoId]);

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('提示', '请输入任务标题');
      return;
    }

    const tags = tagsInput
      .split(/[,，]/)
      .map(t => t.trim())
      .filter(Boolean);

    const currentUser = members[0] || '';

    if (isNew) {
      await dataService.addTodo({
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        assignee,
        creator: currentUser,
        dueDate: dueDate ? new Date(dueDate).toISOString() : '',
        tags,
      });
    } else if (todoId) {
      await dataService.updateTodo(todoId, {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        assignee,
        dueDate: dueDate ? new Date(dueDate).toISOString() : '',
        tags,
      });
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [title, description, status, priority, assignee, dueDate, tagsInput, isNew, todoId, members, navigation]);

  const handleDelete = useCallback(async () => {
    if (!todoId) return;

    Alert.alert('确认删除', '确定要删除这个任务吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await dataService.deleteTodo(todoId);
          if (navigation.canGoBack()) {
            navigation.goBack();
          }
        },
      },
    ]);
  }, [todoId, navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.canGoBack() && navigation.goBack()}>
          <Text style={styles.headerBtn}>返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isNew ? '新建任务' : '编辑任务'}</Text>
        <TouchableOpacity onPress={handleSave} testID="save-button">
          <Text style={[styles.headerBtn, styles.saveBtn]}>保存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>标题 *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="输入任务标题"
            testID="title-input"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>描述</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="输入任务描述"
            multiline
            numberOfLines={3}
            testID="description-input"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>状态</Text>
          <View style={styles.chipGroup}>
            {STATUS_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setStatus(opt.value)}
                testID={`status-${opt.value}`}
              >
                <View
                  style={[styles.chip, status === opt.value && styles.chipActive]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      status === opt.value && styles.chipTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>优先级</Text>
          <View style={styles.chipGroup}>
            {PRIORITY_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setPriority(opt.value)}
                testID={`priority-${opt.value}`}
              >
                <View
                  style={[styles.chip, priority === opt.value && styles.chipActive]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      priority === opt.value && styles.chipTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>指派给</Text>
          {members.length > 0 ? (
            <View style={styles.chipGroup}>
              <TouchableOpacity onPress={() => setAssignee('')} testID="assignee-none">
                <View style={[styles.chip, assignee === '' && styles.chipActive]}>
                  <Text style={[styles.chipText, assignee === '' && styles.chipTextActive]}>未指派</Text>
                </View>
              </TouchableOpacity>
              {members.map(m => (
                <TouchableOpacity key={m} onPress={() => setAssignee(m)} testID={`assignee-${m}`}>
                  <View style={[styles.chip, assignee === m && styles.chipActive]}>
                    <Text style={[styles.chipText, assignee === m && styles.chipTextActive]}>{m}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <TextInput
              style={styles.input}
              value={assignee}
              onChangeText={setAssignee}
              placeholder="输入负责人用户名"
              testID="assignee-input"
            />
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>截止日期</Text>
          <TextInput
            style={styles.input}
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="YYYY-MM-DD"
            testID="duedate-input"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>标签（逗号分隔）</Text>
          <TextInput
            style={styles.input}
            value={tagsInput}
            onChangeText={setTagsInput}
            placeholder="设计, UI"
            testID="tags-input"
          />
        </View>

        {!isNew && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} testID="delete-button">
            <Text style={styles.deleteText}>删除任务</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  headerBtn: {
    fontSize: 16,
    color: '#3b82f6',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1f2937',
  },
  saveBtn: {
    fontWeight: '600',
  },
  form: {
    flex: 1,
    padding: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  deleteBtn: {
    backgroundColor: '#fef2f2',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  deleteText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '500',
  },
});

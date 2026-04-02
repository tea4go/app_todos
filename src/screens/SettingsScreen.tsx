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
import { storage } from '../services/storage';
import { dataService } from '../services/dataService';

export default function SettingsScreen() {
  const [token, setToken] = useState('');
  const [gistId, setGistId] = useState('');
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [newMember, setNewMember] = useState('');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const load = async () => {
      const t = await storage.getToken();
      const g = await storage.getGistId();
      if (t) setToken(t);
      if (g) setGistId(g);

      const data = await dataService.getLocalData();
      setTeamName(data.team);
      setMembers(data.members);
    };
    load();
  }, []);

  const saveToken = useCallback(async () => {
    if (token.trim()) {
      await storage.setToken(token.trim());
      Alert.alert('成功', '令牌已保存');
    }
  }, [token]);

  const saveGistId = useCallback(async () => {
    if (gistId.trim()) {
      await storage.setGistId(gistId.trim());
      Alert.alert('成功', '代码片段 ID 已保存');
    }
  }, [gistId]);

  const handleInit = useCallback(async () => {
    if (!token.trim()) {
      Alert.alert('提示', '请先输入并保存 Gitee 令牌');
      return;
    }
    if (!teamName.trim()) {
      Alert.alert('提示', '请输入团队名称');
      return;
    }

    try {
      const id = await dataService.initGist(teamName.trim());
      setGistId(id);
      Alert.alert('成功', `代码片段已创建，ID: ${id}`);
    } catch (e: any) {
      Alert.alert('错误', e.message || '创建失败');
    }
  }, [token, teamName]);

  const handleAddMember = useCallback(() => {
    const name = newMember.trim();
    if (!name) return;
    if (members.includes(name)) {
      Alert.alert('提示', '该成员已存在');
      return;
    }
    const updated = [...members, name];
    setMembers(updated);
    setNewMember('');
    dataService.updateTeamInfo(teamName, updated);
  }, [newMember, members, teamName]);

  const handleRemoveMember = useCallback(
    (name: string) => {
      const updated = members.filter(m => m !== name);
      setMembers(updated);
      dataService.updateTeamInfo(teamName, updated);
    },
    [members, teamName],
  );

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      await dataService.syncFromRemote();
      Alert.alert('成功', '同步完成');
    } catch (e: any) {
      Alert.alert('同步失败', e.message || '未知错误');
    }
    setSyncing(false);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Gitee 配置</Text>

        <View style={styles.field}>
          <Text style={styles.label}>私人令牌</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              value={token}
              onChangeText={setToken}
              placeholder="输入 Gitee 私人令牌"
              secureTextEntry
              autoCapitalize="none"
              testID="token-input"
            />
            <TouchableOpacity style={styles.btnSmall} onPress={saveToken}>
              <Text style={styles.btnSmallText}>保存</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>代码片段 ID</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              value={gistId}
              onChangeText={setGistId}
              placeholder="输入或自动创建"
              autoCapitalize="none"
              testID="gistid-input"
            />
            <TouchableOpacity style={styles.btnSmall} onPress={saveGistId}>
              <Text style={styles.btnSmallText}>保存</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>团队名称</Text>
          <TextInput
            style={styles.input}
            value={teamName}
            onChangeText={setTeamName}
            placeholder="输入团队名称"
            testID="team-name-input"
          />
        </View>

        <TouchableOpacity style={styles.btnPrimary} onPress={handleInit} testID="init-gist-button">
          <Text style={styles.btnPrimaryText}>初始化代码片段</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>团队成员</Text>

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.inputFlex]}
            value={newMember}
            onChangeText={setNewMember}
            placeholder="输入成员用户名"
            autoCapitalize="none"
            testID="member-input"
          />
          <TouchableOpacity style={styles.btnSmall} onPress={handleAddMember} testID="add-member-button">
            <Text style={styles.btnSmallText}>添加</Text>
          </TouchableOpacity>
        </View>

        {members.map(member => (
          <View key={member} style={styles.memberRow}>
            <Text style={styles.memberName}>{member}</Text>
            <TouchableOpacity onPress={() => handleRemoveMember(member)}>
              <Text style={styles.removeBtn}>移除</Text>
            </TouchableOpacity>
          </View>
        ))}

        <Text style={styles.sectionTitle}>数据同步</Text>

        <TouchableOpacity
          style={[styles.btnPrimary, syncing && styles.btnDisabled]}
          onPress={handleSync}
          disabled={syncing}
          testID="sync-button"
        >
          <Text style={styles.btnPrimaryText}>
            {syncing ? '同步中...' : '手动同步'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.version}>团队待办 v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 12,
  },
  field: {
    marginBottom: 12,
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
  inputFlex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  btnSmall: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnSmallText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  btnPrimary: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  memberName: {
    fontSize: 15,
    color: '#1f2937',
  },
  removeBtn: {
    fontSize: 14,
    color: '#ef4444',
  },
  version: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 24,
    marginBottom: 16,
  },
});

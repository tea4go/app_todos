import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import TaskListScreen from '../screens/TaskListScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';
import FilterScreen from '../screens/FilterScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const FilterStack = createNativeStackNavigator();

function HomeTab() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="TaskList"
        component={TaskListScreen}
        options={{ title: '待办事项', headerShown: false }}
      />
      <HomeStack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{ title: '任务详情', headerShown: false }}
      />
    </HomeStack.Navigator>
  );
}

function FilterTab() {
  return (
    <FilterStack.Navigator>
      <FilterStack.Screen
        name="FilterView"
        component={FilterScreen}
        options={{ title: '筛选', headerShown: false }}
      />
      <FilterStack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{ title: '任务详情', headerShown: false }}
      />
    </FilterStack.Navigator>
  );
}

export default function AppNavigation() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            const icons: Record<string, string> = {
              任务: '✓',
              筛选: '⊞',
              设置: '⚙',
            };
            return (
              <Text style={{ fontSize: size, color }}>
                {icons[route.name] || '?'}
              </Text>
            );
          },
          tabBarActiveTintColor: '#3b82f6',
          tabBarInactiveTintColor: '#9ca3af',
        })}
      >
        <Tab.Screen
          name="任务"
          component={HomeTab}
          options={{ headerShown: false }}
        />
        <Tab.Screen
          name="筛选"
          component={FilterTab}
          options={{ headerShown: false }}
        />
        <Tab.Screen
          name="设置"
          component={SettingsScreen}
          options={{ title: '设置' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

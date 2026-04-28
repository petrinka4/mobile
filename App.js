import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';

import { AppProvider, useApp } from './src/context/AppContext';
import { initDatabase } from './src/database/db';

import HomeScreen        from './src/screens/HomeScreen';
import AddHabitScreen    from './src/screens/AddHabitScreen';
import HabitDetailScreen from './src/screens/HabitDetailScreen';
import SettingsScreen    from './src/screens/SettingsScreen';
import LoginScreen       from './src/screens/LoginScreen';

SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

const TabNavigator = () => {
  const { theme, t, isDarkTheme } = useApp();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor:   theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t('home'),
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? theme.primaryLight : 'transparent',
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 2,
            }} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: t('settings') }}
      />
    </Tab.Navigator>
  );
};

const RootNavigator = () => {
  const { theme, t, isDarkTheme } = useApp();

  return (
    <NavigationContainer>
      <StatusBar
        barStyle={isDarkTheme ? 'light-content' : 'dark-content'}
        backgroundColor={theme.surface}
      />
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.surface,
            shadowColor: theme.border,
            elevation: 2,
          },
          headerTintColor: theme.primary,
          headerTitleStyle: {
            color: theme.text,
            fontWeight: 'bold',
            fontSize: 18,
          },
          cardStyle: { backgroundColor: theme.background },
          headerBackTitleVisible: false,
        }}
      >
        <Stack.Screen
          name="Tabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddHabit"
          component={AddHabitScreen}
          options={{ title: t('addHabit'), presentation: 'modal' }}
        />
        <Stack.Screen
          name="HabitDetail"
          component={HabitDetailScreen}
          options={{ title: t('habitDetail') }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const AppInit = () => {
  const { isReady, authReady, user } = useApp();  
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        await initDatabase();
      } catch (error) {
        console.error('Ошибка инициализации БД:', error);
      } finally {
        setDbReady(true);
      }
    };
    prepare();
  }, []);

  
  useEffect(() => {
    if (isReady && dbReady && authReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady, dbReady, authReady]);  

  if (!isReady || !dbReady || !authReady) return null;

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <View style={{ flex: 1 }}>
      <RootNavigator />
    </View>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <AppInit />
      </AppProvider>
    </GestureHandlerRootView>
  );
}
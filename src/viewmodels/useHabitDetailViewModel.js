import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useApp } from '../context/AppContext';
import {
  getHabitById, deleteHabit, toggleHabitLog,
  isHabitDoneToday, getCurrentStreak, getCompletedDaysCount,
} from '../database/db';
import {
  scheduleHabitReminder,
  cancelHabitReminder,
  requestNotificationPermission,
} from '../services/notificationService';

const REMINDER_KEY_PREFIX = '@habit_reminder_';

export function useHabitDetailViewModel(navigation, habitId) {
  const { t, formatDate, getTodayString } = useApp();
  const [habit, setHabit] = useState(null);
  const [doneToday, setDoneToday] = useState(false);
  const [streak, setStreak] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const todayStr = getTodayString();

  const loadData = useCallback(async () => {
    const key = REMINDER_KEY_PREFIX + habitId;
    console.log('=== loadData start ===');
    console.log('habitId:', habitId, 'todayStr:', todayStr, 'reminderKey:', key);

    try {
      const h = await getHabitById(habitId);
      const done = await isHabitDoneToday(habitId, todayStr);
      const curStreak = await getCurrentStreak(habitId);
      const comp = await getCompletedDaysCount(habitId);

      const stored = await AsyncStorage.getItem(key);
      const enabled = stored === '1';
      const allKeys = await AsyncStorage.getAllKeys();

      console.log('loadData: habit.name =', h?.name);
      console.log('loadData: stored reminder value =', stored, '=> enabled =', enabled);
      console.log('loadData: all AsyncStorage keys =', allKeys);

      setHabit(h);
      setDoneToday(done);
      setStreak(curStreak);
      setCompleted(comp);
      setReminderEnabled(enabled);

      if (h) navigation.setOptions({ title: h.name });
    } catch (e) {
      console.error('loadData error:', e);
    } finally {
      setLoading(false);
      console.log('=== loadData end, will set reminderEnabled =', enabled, '===');
    }
  }, [habitId, todayStr, navigation, reminderEnabled]);

  useFocusEffect(
    useCallback(() => {
      console.log('useFocusEffect -> loadData() for habitId', habitId);
      loadData();
    }, [loadData])
  );

  const handleToggle = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      await toggleHabitLog(habitId, todayStr);
      const done = await isHabitDoneToday(habitId, todayStr);
      const curStreak = await getCurrentStreak(habitId);
      const comp = await getCompletedDaysCount(habitId);
      setDoneToday(done);
      setStreak(curStreak);
      setCompleted(comp);
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(t('deleteConfirm'), t('deleteConfirmMessage'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          console.log('handleDelete: deleting habitId', habitId);
          await cancelHabitReminder(habitId);
          const key = REMINDER_KEY_PREFIX + habitId;
          await AsyncStorage.removeItem(key);
          console.log('handleDelete: removed reminder key', key);
          await deleteHabit(habitId);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleEdit = () => navigation.navigate('AddHabit', { habitId });

  const handleToggleReminder = async (value) => {
    const key = REMINDER_KEY_PREFIX + habitId;
    console.log('handleToggleReminder: habitId =', habitId, 'value =', value, 'prev state =', reminderEnabled);

    
    setReminderEnabled(value);

    
    try {
      await AsyncStorage.setItem(key, value ? '1' : '0');
      const check = await AsyncStorage.getItem(key);
      console.log('handleToggleReminder: after setItem, stored =', check);
    } catch (e) {
      console.error('handleToggleReminder: AsyncStorage setItem error:', e);
    }

    
    const granted = await requestNotificationPermission();
    console.log('handleToggleReminder: notification permission granted =', granted);

    if (!granted) {
      Alert.alert('Нет разрешения', 'Разрешите уведомления в настройках устройства');
      setReminderEnabled(false);
      try {
        await AsyncStorage.setItem(key, '0');
        const check = await AsyncStorage.getItem(key);
        console.log('handleToggleReminder: permission denied, set', key, 'to 0, stored =', check);
      } catch (e) {
        console.error('handleToggleReminder: AsyncStorage setItem(0) error:', e);
      }
      return;
    }

    
    try {
      if (!value) {
        console.log('handleToggleReminder: turning OFF reminder for habitId', habitId);
        await cancelHabitReminder(habitId);
      } else {
        console.log('handleToggleReminder: turning ON reminder for habitId', habitId, 'habit.name =', habit?.name);
        await scheduleHabitReminder(habitId, habit.name, 9, 0);
        Alert.alert('✅ Готово', 'Напоминание установлено на 09:00');
      }
    } catch (e) {
      console.error('handleToggleReminder: notifications error:', e);
    }
  };

  const handleCheckIn = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Нет разрешения', 'Разрешите доступ к геолокации');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const { latitude, longitude } = loc.coords;
    Alert.alert('📍 Отметка', `Широта: ${latitude.toFixed(4)}, Долгота: ${longitude.toFixed(4)}`);
  };

  const percent = habit?.goal_days > 0 ? (completed / habit.goal_days) * 100 : 0;

  return {
    habit, doneToday, streak, completed,
    loading, toggling, percent,
    handleToggle, handleDelete, handleEdit,
    formatDate,
    reminderEnabled, handleToggleReminder,
    handleCheckIn,
  };
}
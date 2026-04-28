import { useState, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  getAllHabits, toggleHabitLog, isHabitDoneToday,
  getCurrentStreak, getCompletedDaysCount,
} from '../database/db';
import { fetchWeather } from '../services/weatherService';
import { db as firestore, auth } from '../firebase/config';
import { collection, query, onSnapshot } from 'firebase/firestore';

export function useHomeViewModel() {
  const { getTodayString, formatDate, isOnline } = useApp();
  const [habits, setHabits] = useState([]);
  const [weather, setWeather] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const todayStr = getTodayString();

  const loadHabits = useCallback(async () => {
    const raw = await getAllHabits();
    const enriched = await Promise.all(
      raw.map(async (habit) => {
        const doneToday = await isHabitDoneToday(habit.id, todayStr);
        const streak = await getCurrentStreak(habit.id);
        const completed = await getCompletedDaysCount(habit.id);
        return { ...habit, doneToday, streak, completed };
      })
    );
    setHabits(enriched);
  }, [todayStr]);

  const loadWeather = useCallback(async () => {
    if (!isOnline) return;
    const data = await fetchWeather();
    setWeather(data);
  }, [isOnline]);

  
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const q = query(collection(firestore, 'users', userId, 'habits'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const firestoreHabits = snapshot.docs.map(d => ({ ...d.data(), id: Number(d.id) }));

      const today = getTodayString();
      const enriched = await Promise.all(
        firestoreHabits.map(async (habit) => {
          const doneToday = await isHabitDoneToday(habit.id, today);
          const streak = await getCurrentStreak(habit.id);
          const completed = await getCompletedDaysCount(habit.id);
          return { ...habit, doneToday, streak, completed };
        })
      );
      enriched.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setHabits(enriched);
    });

    return () => unsubscribe();
  }, []);

  const handleToggle = async (habitId) => {
    await toggleHabitLog(habitId, todayStr);
    await loadHabits();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHabits();
    await loadWeather();
    setRefreshing(false);
  };

  const completedToday = habits.filter((h) => h.doneToday).length;

  return { habits, weather, refreshing, completedToday, handleToggle, onRefresh, todayStr, formatDate };
}
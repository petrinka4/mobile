import { useState, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getAllHabits, getAllLogsForUser, toggleHabitLog } from '../database/db';
import { db as firestore, auth } from '../firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';

const toLocalDate = (d) => {
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const computeStreak = (logsForHabit) => {
  if (!logsForHabit.length) return 0;
  const logSet    = new Set(logsForHabit);
  let   streak    = 0;
  const checkDate = new Date();
  while (true) {
    const dateStr = toLocalDate(checkDate);
    if (logSet.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else break;
  }
  return streak;
};

const enrichWithLogs = (habits, allLogs, today) =>
  habits.map(habit => {
    const habitLogs = allLogs
      .filter(l => l.habit_id === habit.id)
      .map(l => l.log_date);
    return {
      ...habit,
      doneToday: habitLogs.includes(today),
      streak:    computeStreak(habitLogs),
      completed: habitLogs.length,
    };
  });

export function useHomeViewModel() {
  const { getTodayString, formatDate, isOnline } = useApp();
  const [habits, setHabits]       = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const todayStr = getTodayString();

  const loadHabits = useCallback(async () => {
    const [raw, allLogs] = await Promise.all([
      getAllHabits(),
      getAllLogsForUser(),
    ]);
    setHabits(enrichWithLogs(raw, allLogs, getTodayString()));
  }, [getTodayString]);

  
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) { loadHabits(); return; }

    const unsub = onSnapshot(
      collection(firestore, 'users', userId, 'habits'),
      async () => { await loadHabits(); }
    );
    return () => unsub();
  }, [loadHabits]);

  const handleToggle = async (habitId) => {
    await toggleHabitLog(habitId, todayStr);
    await loadHabits();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHabits();
    setRefreshing(false);
  };

  const completedToday = habits.filter(h => h.doneToday).length;

  return { habits, refreshing, completedToday, handleToggle, onRefresh, todayStr, formatDate };
}
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db as firestore, auth } from '../firebase/config';
import {
  doc, setDoc, deleteDoc, serverTimestamp, getDoc,
} from 'firebase/firestore';

const HABITS_KEY = '@habits';
const LOGS_KEY   = '@habit_logs';

const getUserSuffix = () => {
  const uid = auth.currentUser?.uid;
  return uid ? `_${uid}` : '';
};

const getHabitsKey = () => `${HABITS_KEY}${getUserSuffix()}`;
const getLogsKey   = () => `${LOGS_KEY}${getUserSuffix()}`;

const getHabits = async () => {
  const raw = await AsyncStorage.getItem(getHabitsKey());
  return raw ? JSON.parse(raw) : [];
};

const saveHabits = async (habits) => {
  await AsyncStorage.setItem(getHabitsKey(), JSON.stringify(habits));
};

const getLogs = async () => {
  const raw = await AsyncStorage.getItem(getLogsKey());
  return raw ? JSON.parse(raw) : [];
};

const saveLogs = async (logs) => {
  await AsyncStorage.setItem(getLogsKey(), JSON.stringify(logs));
};

export const initDatabase = async () => {
  return true;
};

export const getAllHabits = async () => {
  try {
    const habits = await getHabits();
    return habits.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
  } catch (error) {
    console.error('getAllHabits error:', error);
    return [];
  }
};

export const getHabitById = async (id) => {
  try {
    const userId = auth.currentUser?.uid;
    if (userId) {
      const ref = doc(firestore, 'users', userId, 'habits', String(id));
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        return {
          id,
          ...data,
        };
      }
    }

    const habits = await getHabits();
    return habits.find((h) => h.id === id) ?? null;
  } catch (error) {
    console.error('getHabitById error:', error);
    return null;
  }
};

export const createHabit = async (habit) => {
  try {
    const habits  = await getHabits();
    const newId   = Date.now();
    const newHabit = {
      id:                newId,
      name:              habit.name,
      description:       habit.description ?? '',
      frequency:         habit.frequency,
      goal_days:         habit.goal_days,
      start_date:        habit.start_date,
      color:             habit.color,
      photo_url:         habit.photo_url ?? null,
      reminder_enabled:  habit.reminder_enabled ?? false,
      created_at:        new Date().toISOString(),
    };
    habits.push(newHabit);
    await saveHabits(habits);

    try {
      const userId = auth.currentUser?.uid;
      if (userId) {
        await setDoc(doc(firestore, 'users', userId, 'habits', String(newId)), {
          ...newHabit,
          synced_at: serverTimestamp(),
        });
      }
    } catch (e) {
      console.warn('Firestore createHabit sync error:', e);
    }

    return newId;
  } catch (error) {
    console.error('createHabit error:', error);
    return null;
  }
};

export const updateHabit = async (id, habit) => {
  try {
    const habits = await getHabits();
    const index  = habits.findIndex((h) => h.id === id);
    if (index === -1) return false;

    habits[index] = {
      ...habits[index],
      name:              habit.name,
      description:       habit.description ?? '',
      frequency:         habit.frequency,
      goal_days:         habit.goal_days,
      start_date:        habit.start_date,
      color:             habit.color,
      photo_url:         habit.photo_url ?? habits[index].photo_url,
      reminder_enabled:  typeof habit.reminder_enabled === 'boolean'
                           ? habit.reminder_enabled
                           : (habits[index].reminder_enabled ?? false),
    };
    await saveHabits(habits);

    try {
      const userId = auth.currentUser?.uid;
      if (userId) {
        await setDoc(
          doc(firestore, 'users', userId, 'habits', String(id)),
          { ...habits[index], synced_at: serverTimestamp() },
          { merge: true }
        );
      }
    } catch (e) {
      console.warn('Firestore updateHabit sync error:', e);
    }

    return true;
  } catch (error) {
    console.error('updateHabit error:', error);
    return false;
  }
};

export const deleteHabit = async (id) => {
  try {
    const habits   = await getHabits();
    const filtered = habits.filter((h) => h.id !== id);
    await saveHabits(filtered);

    const logs         = await getLogs();
    const filteredLogs = logs.filter((l) => l.habit_id !== id);
    await saveLogs(filteredLogs);

    try {
      const userId = auth.currentUser?.uid;
      if (userId) {
        await deleteDoc(doc(firestore, 'users', userId, 'habits', String(id)));
      }
    } catch (e) {
      console.warn('Firestore deleteHabit sync error:', e);
    }

    return true;
  } catch (error) {
    console.error('deleteHabit error:', error);
    return false;
  }
};

export const toggleHabitLog = async (habitId, date) => {
  try {
    const logs  = await getLogs();
    const index = logs.findIndex(
      (l) => l.habit_id === habitId && l.log_date === date
    );

    if (index !== -1) {
      logs.splice(index, 1);
      await saveLogs(logs);
      return false;
    } else {
      logs.push({ habit_id: habitId, log_date: date });
      await saveLogs(logs);
      return true;
    }
  } catch (error) {
    console.error('toggleHabitLog error:', error);
    return null;
  }
};

export const isHabitDoneToday = async (habitId, date) => {
  try {
    const logs = await getLogs();
    return logs.some((l) => l.habit_id === habitId && l.log_date === date);
  } catch (error) {
    console.error('isHabitDoneToday error:', error);
    return false;
  }
};

export const getCompletedDaysCount = async (habitId) => {
  try {
    const logs = await getLogs();
    return logs.filter((l) => l.habit_id === habitId).length;
  } catch (error) {
    console.error('getCompletedDaysCount error:', error);
    return 0;
  }
};

export const getCurrentStreak = async (habitId) => {
  try {
    const logs = await getLogs();
    const habitLogs = logs
      .filter((l) => l.habit_id === habitId)
      .map((l) => l.log_date)
      .sort()
      .reverse();

    if (habitLogs.length === 0) return 0;

    const toLocalDateStr = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const today = new Date();
    let streak = 0;
    let checkDate = new Date(today);
    const logSet = new Set(habitLogs);

    while (true) {
      const dateStr = toLocalDateStr(checkDate);
      if (logSet.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error('getCurrentStreak error:', error);
    return 0;
  }
};

export const isNameDuplicate = async (name, excludeId = null) => {
  try {
    const habits = await getHabits();
    return habits.some(
      (h) =>
        h.name.toLowerCase().trim() === name.toLowerCase().trim() &&
        h.id !== excludeId
    );
  } catch (error) {
    console.error('isNameDuplicate error:', error);
    return false;
  }
};
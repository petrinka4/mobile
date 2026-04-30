import AsyncStorage from '@react-native-async-storage/async-storage';
import { db as firestore, auth } from '../firebase/config';
import {
  collection, doc, setDoc, deleteDoc,
  getDocs, getDoc, query, where,
  writeBatch, serverTimestamp,
} from 'firebase/firestore';

export const initDatabase = async () => true;


const uid       = () => auth.currentUser?.uid;
const habitsRef = () => collection(firestore, 'users', uid(), 'habits');
const logsRef   = () => collection(firestore, 'users', uid(), 'logs');
const logDocId  = (habitId, date) => `${habitId}_${date}`;

const toLocalDate = (d) => {
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};



const cacheKey = (type) => `@${type}_cache_${uid() ?? 'guest'}`;

const setCache = async (type, data) => {
  try { await AsyncStorage.setItem(cacheKey(type), JSON.stringify(data)); } catch (_) {}
};

const getCache = async (type) => {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(type));
    return raw ? JSON.parse(raw) : [];
  } catch (_) { return []; }
};



export const getAllHabits = async () => {
  try {
    if (!uid()) return getCache('habits');
    const snap   = await getDocs(habitsRef());
    const habits = snap.docs.map(d => ({ ...d.data(), id: Number(d.id) }));
    habits.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    await setCache('habits', habits);
    return habits;
  } catch (err) {
    console.warn('getAllHabits: offline, using cache');
    return getCache('habits');
  }
};

export const getHabitById = async (id) => {
  try {
    if (!uid()) {
      const list = await getCache('habits');
      return list.find(h => h.id === id) ?? null;
    }
    const snap = await getDoc(doc(habitsRef(), String(id)));
    return snap.exists() ? { ...snap.data(), id: Number(snap.id) } : null;
  } catch (err) {
    const list = await getCache('habits');
    return list.find(h => h.id === id) ?? null;
  }
};

export const createHabit = async (habit) => {
  try {
    const newId    = Date.now();
    const newHabit = {
      id:               newId,
      name:             habit.name,
      description:      habit.description ?? '',
      frequency:        habit.frequency,
      goal_days:        habit.goal_days,
      start_date:       habit.start_date,
      color:            habit.color,
      photo_url:        habit.photo_url ?? null,
      reminder_enabled: habit.reminder_enabled ?? false,
      created_at:       new Date().toISOString(),
    };
    if (uid()) {
      await setDoc(
        doc(habitsRef(), String(newId)),
        { ...newHabit, synced_at: serverTimestamp() }
      );
    }
    const cached = await getCache('habits');
    await setCache('habits', [newHabit, ...cached]);
    return newId;
  } catch (err) {
    console.error('createHabit error:', err);
    return null;
  }
};

export const updateHabit = async (id, habit) => {
  try {
    const current = await getHabitById(id);
    if (!current) return false;
    const updated = {
      ...current,
      name:             habit.name,
      description:      habit.description ?? '',
      frequency:        habit.frequency,
      goal_days:        habit.goal_days,
      start_date:       habit.start_date,
      color:            habit.color,
      photo_url:        habit.photo_url ?? current.photo_url,
      reminder_enabled: typeof habit.reminder_enabled === 'boolean'
                          ? habit.reminder_enabled
                          : (current.reminder_enabled ?? false),
    };
    if (uid()) {
      await setDoc(
        doc(habitsRef(), String(id)),
        { ...updated, synced_at: serverTimestamp() },
        { merge: true }
      );
    }
    const cached = await getCache('habits');
    const idx    = cached.findIndex(h => h.id === id);
    if (idx !== -1) { cached[idx] = updated; await setCache('habits', cached); }
    return true;
  } catch (err) {
    console.error('updateHabit error:', err);
    return false;
  }
};

export const deleteHabit = async (id) => {
  try {
    if (uid()) {
      await deleteDoc(doc(habitsRef(), String(id)));
      const logsSnap = await getDocs(query(logsRef(), where('habit_id', '==', id)));
      if (!logsSnap.empty) {
        const batch = writeBatch(firestore);
        logsSnap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    }
    const cached     = await getCache('habits');
    const cachedLogs = await getCache('logs');
    await setCache('habits', cached.filter(h => h.id !== id));
    await setCache('logs', cachedLogs.filter(l => l.habit_id !== id));
    return true;
  } catch (err) {
    console.error('deleteHabit error:', err);
    return false;
  }
};


export const getAllLogsForUser = async () => {
  try {
    if (!uid()) return getCache('logs');
    const snap = await getDocs(logsRef());
    const logs = snap.docs.map(d => d.data());
    await setCache('logs', logs);
    return logs;
  } catch (err) {
    console.warn('getAllLogsForUser: offline, using cache');
    return getCache('logs');
  }
};

export const toggleHabitLog = async (habitId, date) => {
  try {
    const logId  = logDocId(habitId, date);
    const cached = await getCache('logs');

    if (uid()) {
      const ref  = doc(logsRef(), logId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await deleteDoc(ref);
        await setCache('logs', cached.filter(
          l => !(l.habit_id === habitId && l.log_date === date)
        ));
        return false;
      } else {
        const entry = { habit_id: habitId, log_date: date };
        await setDoc(ref, entry);
        await setCache('logs', [...cached, entry]);
        return true;
      }
    } else {
      const idx = cached.findIndex(l => l.habit_id === habitId && l.log_date === date);
      if (idx !== -1) {
        cached.splice(idx, 1);
        await setCache('logs', cached);
        return false;
      } else {
        cached.push({ habit_id: habitId, log_date: date });
        await setCache('logs', cached);
        return true;
      }
    }
  } catch (err) {
    console.error('toggleHabitLog error:', err);
    return null;
  }
};

export const isHabitDoneToday = async (habitId, date) => {
  try {
    if (uid()) {
      const snap = await getDoc(doc(logsRef(), logDocId(habitId, date)));
      return snap.exists();
    }
    const logs = await getCache('logs');
    return logs.some(l => l.habit_id === habitId && l.log_date === date);
  } catch (err) {
    console.error('isHabitDoneToday error:', err);
    return false;
  }
};

export const getCompletedDaysCount = async (habitId) => {
  try {
    if (uid()) {
      const snap = await getDocs(query(logsRef(), where('habit_id', '==', habitId)));
      return snap.size;
    }
    const logs = await getCache('logs');
    return logs.filter(l => l.habit_id === habitId).length;
  } catch (err) {
    console.error('getCompletedDaysCount error:', err);
    return 0;
  }
};

export const getCurrentStreak = async (habitId) => {
  try {
    let dates;
    if (uid()) {
      const snap = await getDocs(query(logsRef(), where('habit_id', '==', habitId)));
      dates = snap.docs.map(d => d.data().log_date);
    } else {
      const logs = await getCache('logs');
      dates = logs.filter(l => l.habit_id === habitId).map(l => l.log_date);
    }
    if (dates.length === 0) return 0;

    const logSet    = new Set(dates);
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
  } catch (err) {
    console.error('getCurrentStreak error:', err);
    return 0;
  }
};

export const isNameDuplicate = async (name, excludeId = null) => {
  try {
    const habits = await getAllHabits();
    return habits.some(
      h => h.name.toLowerCase().trim() === name.toLowerCase().trim() && h.id !== excludeId
    );
  } catch (err) {
    console.error('isNameDuplicate error:', err);
    return false;
  }
};
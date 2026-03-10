import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useApp } from '../context/AppContext';
import {
  getAllHabits,
  toggleHabitLog,
  isHabitDoneToday,
  getCurrentStreak,
  getCompletedDaysCount,
} from '../database/db';
import HabitCard from '../components/HabitCard';


const EmptyList = ({ theme, t }) => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyEmoji}>🌱</Text>
    <Text style={[styles.emptyTitle, { color: theme.text }]}>
      {t('noHabits')}
    </Text>
    <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
      {t('noHabitsSubtitle')}
    </Text>
  </View>
);


const DayHeader = ({ completed, total, theme, t }) => (
  <View style={[styles.dayHeader, { backgroundColor: theme.primary }]}>
    <Text style={styles.dayHeaderTitle}>{t('todayHabits')}</Text>
    <View style={styles.dayHeaderBadge}>
      <Text style={styles.dayHeaderCount}>
        {t('completedToday')}: {completed} {t('of')} {total}
      </Text>
    </View>
    {}
    <View style={styles.progressBarBg}>
      <View
        style={[
          styles.progressBarFill,
          { width: total > 0 ? `${(completed / total) * 100}%` : '0%' },
        ]}
      />
    </View>
  </View>
);


export default function HomeScreen({ navigation }) {
  const { theme, t, getTodayString, formatDate } = useApp();

  const [habits, setHabits]       = useState([]);
  const [todayStr]                = useState(getTodayString());
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadHabits();
    }, [])
  );

  const loadHabits = async () => {
    try {
      const raw = await getAllHabits();

      const enriched = await Promise.all(
        raw.map(async (habit) => {
          const doneToday = await isHabitDoneToday(habit.id, todayStr);
          const streak    = await getCurrentStreak(habit.id);
          const completed = await getCompletedDaysCount(habit.id);
          return { ...habit, doneToday, streak, completed };
        })
      );

      setHabits(enriched);
    } catch (error) {
      console.error('loadHabits error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHabits();
    setRefreshing(false);
  };

  const handleToggle = async (habitId) => {
    await toggleHabitLog(habitId, todayStr);
    await loadHabits();
  };

  const completedToday = habits.filter((h) => h.doneToday).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={habits}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        ListHeaderComponent={
          habits.length > 0
            ? <DayHeader
                completed={completedToday}
                total={habits.length}
                theme={theme}
                t={t}
              />
            : null
        }
        ListEmptyComponent={<EmptyList theme={theme} t={t} />}
        renderItem={({ item }) => (
          <HabitCard
            habit={item}
            onToggle={() => handleToggle(item.id)}
            onPress={() => navigation.navigate('HabitDetail', { habitId: item.id })}
            theme={theme}
            t={t}
            formatDate={formatDate}
          />
        )}
        contentContainerStyle={
          habits.length === 0
            ? styles.emptyListContent
            : styles.listContent
        }
      />

      {}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('AddHabit')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyListContent: {
    flexGrow: 1,
  },

  dayHeader: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  dayHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  dayHeaderBadge: {
    marginBottom: 12,
  },
  dayHeaderCount: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  fabIcon: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '300',
  },
});

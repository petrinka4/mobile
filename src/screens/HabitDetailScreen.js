import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useApp } from '../context/AppContext';
import {
  getHabitById,
  deleteHabit,
  toggleHabitLog,
  isHabitDoneToday,
  getCurrentStreak,
  getCompletedDaysCount,
} from '../database/db';


const InfoRow = ({ label, value, theme }) => (
  <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
    <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</Text>
    <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
  </View>
);


const ProgressCircle = ({ percent, color, theme }) => {
  const clamped = Math.min(Math.round(percent), 100);
  return (
    <View style={styles.progressCircleWrapper}>
      <View style={[styles.progressCircleOuter, { borderColor: theme.border }]}>
        <View style={[styles.progressCircleInner, { borderColor: color }]}>
          <Text style={[styles.progressPercent, { color }]}>{clamped}%</Text>
          <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>
            прогресс
          </Text>
        </View>
      </View>
    </View>
  );
};


export default function HabitDetailScreen({ navigation, route }) {
  const { theme, t, formatDate, getTodayString } = useApp();
  const { habitId } = route.params;

  const [habit, setHabit]         = useState(null);
  const [doneToday, setDoneToday] = useState(false);
  const [streak, setStreak]       = useState(0);
  const [completed, setCompleted] = useState(0);
  const [loading, setLoading]     = useState(true);
  const [toggling, setToggling]   = useState(false);

  const todayStr = getTodayString();

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const h         = await getHabitById(habitId);
      const done      = await isHabitDoneToday(habitId, todayStr);
      const curStreak = await getCurrentStreak(habitId);
      const comp      = await getCompletedDaysCount(habitId);

      setHabit(h);
      setDoneToday(done);
      setStreak(curStreak);
      setCompleted(comp);

      if (h) {
        navigation.setOptions({ title: h.name });
      }
    } catch (error) {
      console.error('loadData error:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleToggle = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      await toggleHabitLog(habitId, todayStr);
      const done      = await isHabitDoneToday(habitId, todayStr);
      const curStreak = await getCurrentStreak(habitId);
      const comp      = await getCompletedDaysCount(habitId);
      setDoneToday(done);
      setStreak(curStreak);
      setCompleted(comp);
    } catch (error) {
      console.error('handleToggle error:', error);
    } finally {
      setToggling(false);
    }
  };


  const handleDelete = () => {
    Alert.alert(
      t('deleteConfirm'),
      t('deleteConfirmMessage'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHabit(habitId);
              navigation.goBack();
            } catch (error) {
              console.error('deleteHabit error:', error);
              Alert.alert('Ошибка', 'Не удалось удалить привычку');
            }
          },
        },
      ]
    );
  };


  const handleEdit = () => {
    navigation.navigate('AddHabit', { habitId });
  };


  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!habit) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.textSecondary }}>Привычка не найдена</Text>
      </View>
    );
  }

  const percent = habit.goal_days > 0
    ? (completed / habit.goal_days) * 100
    : 0;

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
    >
      {}
      <View style={[styles.hero, { backgroundColor: habit.color }]}>
        <Text style={styles.heroName}>{habit.name}</Text>
        {habit.description ? (
          <Text style={styles.heroDesc}>{habit.description}</Text>
        ) : null}

        {}
        <View style={styles.streakBadge}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakText}>
            {streak} {t('streak')}
          </Text>
        </View>
      </View>

      {}
      <TouchableOpacity
        style={[
          styles.doneButton,
          {
            backgroundColor: doneToday ? theme.success  : theme.primary,
            opacity:          toggling  ? 0.7            : 1,
          },
        ]}
        onPress={handleToggle}
        disabled={toggling}
        activeOpacity={0.85}
      >
        {toggling ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.doneButtonText}>
            {doneToday ? t('alreadyDone') : t('markDone')}
          </Text>
        )}
      </TouchableOpacity>

      {}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>
          {t('progress')}
        </Text>

        <ProgressCircle percent={percent} color={habit.color} theme={theme} />

        {}
        <View style={[styles.progressBarBg, { backgroundColor: theme.inputBackground }]}>
          <View
            style={[
              styles.progressBarFill,
              {
                width:           `${Math.min(percent, 100)}%`,
                backgroundColor: habit.color,
              },
            ]}
          />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: habit.color }]}>
              {completed}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              {t('daysCompleted')}
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.text }]}>
              {habit.goal_days}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              {t('daysTotal')}
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.primary }]}>
              {streak}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              {t('streak')}
            </Text>
          </View>
        </View>
      </View>

      {}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>
          Информация
        </Text>
        <InfoRow
          label={t('startedOn')}
          value={formatDate(habit.start_date)}
          theme={theme}
        />
        <InfoRow
          label={t('frequency')}
          value={t(habit.frequency)}
          theme={theme}
        />
        <InfoRow
          label={t('goalDays')}
          value={`${habit.goal_days} дн.`}
          theme={theme}
        />
      </View>

      {}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}
          onPress={handleEdit}
          activeOpacity={0.8}
        >
          <Text style={[styles.actionButtonText, { color: theme.primary }]}>
            ✏️  {t('edit')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.danger + '18', borderColor: theme.danger }]}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <Text style={[styles.actionButtonText, { color: theme.danger }]}>
            🗑  {t('delete')}
          </Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  
  hero: {
    padding: 24,
    paddingTop: 28,
    paddingBottom: 32,
  },
  heroName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  heroDesc: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
    lineHeight: 22,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  streakEmoji: { fontSize: 18 },
  streakText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },

  doneButton: {
    marginHorizontal: 16,
    marginTop: -18,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  card: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },

  progressCircleWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  progressCircleOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircleInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressLabel: {
    fontSize: 11,
    marginTop: 2,
  },

  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },

  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    margin: 16,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

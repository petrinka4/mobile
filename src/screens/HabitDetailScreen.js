import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Switch, Share, Alert, Image,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useHabitDetailViewModel } from '../viewmodels/useHabitDetailViewModel';

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
          <Text style={[styles.progressPercent, { color: theme.text }]}>{clamped}%</Text>
          <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>прогресс</Text>
        </View>
      </View>
    </View>
  );
};

export default function HabitDetailScreen({ navigation, route }) {
  const { theme, t } = useApp();
  const { habitId } = route.params;

  const {
    habit, doneToday, streak, completed,
    loading, toggling, percent,
    handleToggle, handleDelete, handleEdit,
    formatDate,
    reminderEnabled, handleToggleReminder,
    handleCheckIn,
  } = useHabitDetailViewModel(navigation, habitId);

  const handleShare = async () => {
    if (!habit) return;
    const progress = habit.goal_days > 0 ? Math.round((completed / habit.goal_days) * 100) : 0;
    await Share.share({
      message:
        `🎯 Я формирую привычку "${habit.name}" уже ${streak} дней подряд!\n` +
        `📊 Прогресс: ${completed}/${habit.goal_days} дней (${progress}%)\n` +
        `💪 Присоединяйся к Habit Tracker!`,
    });
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  if (!habit) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Привычка не найдена</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>

      {/* Hero-блок */}
      <View style={[styles.hero, { backgroundColor: habit.color }]}>
        <Text style={styles.heroName}>{habit.name}</Text>
        {habit.description ? (
          <Text style={styles.heroDesc}>{habit.description}</Text>
        ) : null}

        {habit.photo_url ? (
          <Image
            source={{ uri: habit.photo_url }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        ) : null}

        <View style={styles.streakBadge}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakText}>{streak} {t('streak')}</Text>
        </View>
      </View>

      {/* Кнопка "Выполнено" */}
      <TouchableOpacity
        style={[styles.doneButton, { backgroundColor: doneToday ? theme.success : habit.color }]}
        onPress={handleToggle}
        disabled={toggling}
        activeOpacity={0.85}
      >
        {toggling
          ? <ActivityIndicator color="#FFFFFF" />
          : <Text style={styles.doneButtonText}>{doneToday ? t('alreadyDone') : t('markDone')}</Text>
        }
      </TouchableOpacity>

      {/* Карточка прогресса */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{t('progress')}</Text>
        <ProgressCircle percent={percent} color={habit.color} theme={theme} />
        <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
          <View
            style={[
              styles.progressBarFill,
              { backgroundColor: habit.color, width: `${Math.min(percent, 100)}%` },
            ]}
          />
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.text }]}>{completed}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t('daysCompleted')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.text }]}>{habit.goal_days}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t('daysTotal')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.text }]}>{streak}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t('streak')}</Text>
          </View>
        </View>
      </View>

      {/* Карточка уведомлений */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>🔔 Напоминание</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: theme.text }}>Каждый день в 09:00</Text>
          <Switch
            value={reminderEnabled}
            onValueChange={handleToggleReminder}
            trackColor={{ false: theme.border, true: habit.color }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Карточка информации */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Информация</Text>
        <InfoRow label={t('startedOn')} value={formatDate(habit.start_date)} theme={theme} />
        <InfoRow label={t('frequency')} value={t(habit.frequency)} theme={theme} />
        <InfoRow label={t('goalDays')} value={`${habit.goal_days} дн.`} theme={theme} />
      </View>

      {/* Кнопки действий */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: theme.primary }]}
          onPress={handleEdit}
        >
          <Text style={[styles.actionButtonText, { color: theme.primary }]}>✏️ {t('edit')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { borderColor: theme.primary }]}
          onPress={handleShare}
        >
          <Text style={[styles.actionButtonText, { color: theme.primary }]}>📤 Поделиться</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { borderColor: theme.danger }]}
          onPress={handleDelete}
        >
          <Text style={[styles.actionButtonText, { color: theme.danger }]}>🗑 {t('delete')}</Text>
        </TouchableOpacity>
      </View>

      {/* Геолокация */}
      <View style={{ marginHorizontal: 16, marginTop: 12, marginBottom: 40 }}>
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: theme.border, width: '100%' }]}
          onPress={handleCheckIn}
        >
          <Text style={[styles.actionButtonText, { color: theme.textSecondary }]}>
            📍 Отметить место
          </Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: { padding: 24, paddingTop: 28, paddingBottom: 32 },
  heroName: { fontSize: 26, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 6 },
  heroDesc: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
    lineHeight: 22,
  },
  heroImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
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
  streakText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
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
  doneButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  card: { margin: 16, marginBottom: 0, borderRadius: 16, borderWidth: 1, padding: 18 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  progressCircleWrapper: { alignItems: 'center', marginBottom: 16 },
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
  progressPercent: { fontSize: 24, fontWeight: 'bold' },
  progressLabel: { fontSize: 11, marginTop: 2 },
  progressBarBg: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 16 },
  progressBarFill: { height: '100%', borderRadius: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statNumber: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 11, textAlign: 'center' },
  statDivider: { width: 1, height: 40 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 12, margin: 16, marginTop: 16 },
  actionButton: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  actionButtonText: { fontSize: 15, fontWeight: '600' },
});
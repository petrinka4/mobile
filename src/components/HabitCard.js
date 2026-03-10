import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';

export default function HabitCard({ habit, onToggle, onPress, theme, t, formatDate }) {
  const progress = habit.goal_days > 0
    ? Math.min((habit.completed / habit.goal_days) * 100, 100)
    : 0;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {}
      <View style={[styles.colorBar, { backgroundColor: habit.color }]} />

      <View style={styles.content}>
        {}
        <View style={styles.row}>
          <View style={styles.nameContainer}>
            <Text
              style={[styles.name, { color: theme.text }]}
              numberOfLines={1}
            >
              {habit.name}
            </Text>
            {habit.description ? (
              <Text
                style={[styles.description, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {habit.description}
              </Text>
            ) : null}
          </View>

          {}
          <TouchableOpacity
            style={[
              styles.checkButton,
              {
                backgroundColor: habit.doneToday ? habit.color : 'transparent',
                borderColor:      habit.doneToday ? habit.color : theme.border,
              },
            ]}
            onPress={onToggle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {habit.doneToday && (
              <Text style={styles.checkIcon}>✓</Text>
            )}
          </TouchableOpacity>
        </View>

        {}
        <View style={[styles.progressBg, { backgroundColor: theme.inputBackground }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress}%`, backgroundColor: habit.color },
            ]}
          />
        </View>

        {}
        <View style={styles.row}>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>
            🔥 {habit.streak} {t('streak')}
          </Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>
            {habit.completed}/{habit.goal_days} {t('daysTotal')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  colorBar: {
    width: 5,
  },
  content: {
    flex: 1,
    padding: 14,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameContainer: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
    marginTop: 2,
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  meta: {
    fontSize: 12,
  },
});

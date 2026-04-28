import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleHabitReminder(habitId, habitName, hour = 9, minute = 0) {
  await cancelHabitReminder(habitId);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎯 Время для привычки!',
      body: `Не забудь: ${habitName}`,
      data: { habitId: String(habitId) },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY, 
      hour,
      minute,
      repeats: true,
    },
  });

  return id;
}

export async function cancelHabitReminder(habitId) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const target = String(habitId);
  for (const n of scheduled) {
    if (String(n.content.data?.habitId) === target) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}

export async function sendTestNotification(habitName) {
  await Notifications.scheduleNotificationAsync({
    content: { title: '✅ Тест', body: `Уведомление для: ${habitName}` },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 3,
    },
  });
}
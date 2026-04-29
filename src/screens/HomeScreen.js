import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, TextInput, ActivityIndicator,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useHomeViewModel } from '../viewmodels/useHomeViewModel';
import HabitCard from '../components/HabitCard';
import { filterHabits } from '../utils/fuzzySearch';
import { fetchWeather } from '../services/weatherService';


const EmptyList = ({ theme, t }) => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyEmoji}>🌱</Text>
    <Text style={[styles.emptyTitle,   { color: theme.text }]}>{t('noHabits')}</Text>
    <Text style={[styles.emptySubtitle,{ color: theme.textSecondary }]}>{t('noHabitsSubtitle')}</Text>
  </View>
);


const WeatherWidget = ({ weather, loading, onPress, theme }) => (
  <View style={[styles.weatherWidget, { backgroundColor: theme.primaryLight }]}>
    {weather ? (
      <Text style={[styles.weatherText, { color: theme.primary }]}>
        {weather.icon} {weather.city}: {weather.temp}°C, {weather.desc}
      </Text>
    ) : (
      <Text style={[styles.weatherText, { color: theme.textSecondary }]}>
        Погода не загружена
      </Text>
    )}
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      style={[styles.weatherButton, { backgroundColor: theme.primary }]}
    >
      {loading
        ? <ActivityIndicator color="#fff" size="small" />
        : <Text style={styles.weatherButtonText}>🌤 Узнать погоду в Минске</Text>
      }
    </TouchableOpacity>
  </View>
);


const DayHeader = ({ completed, total, theme, t }) => (
  <View style={[styles.dayHeader, { backgroundColor: theme.primary }]}>
    <Text style={styles.dayHeaderTitle}>{t('todayHabits')}</Text>
    <Text style={styles.dayHeaderCount}>
      {t('completedToday')}: {completed} {t('of')} {total}
    </Text>
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
  const { theme, t, isOnline } = useApp();
  const { habits, refreshing, completedToday, handleToggle, onRefresh, formatDate } =
    useHomeViewModel();

  const [query, setQuery] = useState('');
  const [filterFrequency, setFilterFrequency] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const handleFetchWeather = async () => {
    setWeatherLoading(true);
    try {
      const data = await fetchWeather();
      setWeather(data);
    } finally {
      setWeatherLoading(false);
    }
  };

  const displayedHabits = filterHabits(habits, {
    query,
    frequency: filterFrequency,
    sortBy,
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {!isOnline && (
        <View style={[styles.offlineBanner, { backgroundColor: theme.danger }]}>
          <Text style={styles.offlineText}>📡 Нет интернета — показаны кэшированные данные</Text>
        </View>
      )}

      <FlatList
        data={displayedHabits}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <>
            <WeatherWidget
              weather={weather}
              loading={weatherLoading}
              onPress={handleFetchWeather}
              theme={theme}
            />

            <View style={[styles.searchBar, { backgroundColor: theme.inputBackground }]}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="🔍 Поиск привычек..."
                placeholderTextColor={theme.placeholder}
                style={[styles.searchInput, { color: theme.text }]}
                blurOnSubmit={false}
                returnKeyType="search"
              />
            </View>

            <View style={styles.filterRow}>
              {['all', 'daily', 'weekly'].map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFilterFrequency(f)}
                  style={[
                    styles.filterChip,
                    filterFrequency === f && { backgroundColor: theme.primary },
                  ]}
                >
                  <Text style={{ color: filterFrequency === f ? '#fff' : theme.textSecondary, fontSize: 12 }}>
                    {f === 'all' ? 'Все' : f === 'daily' ? 'Ежедневно' : 'Еженедельно'}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() =>
                  setSortBy((s) =>
                    s === 'date' ? 'streak' : s === 'streak' ? 'progress' : s === 'progress' ? 'name' : 'date'
                  )
                }
                style={[styles.filterChip, { backgroundColor: theme.primaryLight }]}
              >
                <Text style={{ color: theme.primary, fontSize: 12 }}>
                  {sortBy === 'date' ? '📅 Дата' : sortBy === 'streak' ? '🔥 Стрик' : sortBy === 'progress' ? '📊 Прогресс' : '🔤 Имя'}
                </Text>
              </TouchableOpacity>
            </View>

            {habits.length > 0 && (
              <DayHeader completed={completedToday} total={habits.length} theme={theme} t={t} />
            )}
          </>
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
          displayedHabits.length === 0 ? styles.emptyListContent : styles.listContent
        }
      />

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
  container: { flex: 1 },
  listContent: { paddingBottom: 100 },
  emptyListContent: { flexGrow: 1 },
  weatherWidget: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  weatherText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  weatherButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  weatherButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  dayHeader: { margin: 16, borderRadius: 16, padding: 20 },
  dayHeaderTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
  dayHeaderCount: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginBottom: 12 },
  progressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#FFFFFF', borderRadius: 3 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingBottom: 80 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 58, height: 58, borderRadius: 29, justifyContent: 'center', alignItems: 'center', elevation: 6 },
  fabIcon: { color: '#FFFFFF', fontSize: 28, lineHeight: 32, fontWeight: '300' },
  offlineBanner: { padding: 8, alignItems: 'center' },
  offlineText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  searchBar: { marginHorizontal: 16, marginTop: 12, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: { fontSize: 15 },
  filterRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 8, gap: 8, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
});
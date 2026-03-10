import React from 'react';
import {
  View, Text, TouchableOpacity,
  ScrollView, StyleSheet, Switch,
} from 'react-native';

import { useApp } from '../context/AppContext';


const Section = ({ title, theme, children }) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
      {title}
    </Text>
    <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {children}
    </View>
  </View>
);


const SwitchRow = ({ label, subtitle, value, onValueChange, theme, color }) => (
  <View style={[styles.row, { borderBottomColor: theme.border }]}>
    <View style={styles.rowText}>
      <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
      {subtitle ? (
        <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: theme.border, true: color + '88' }}
      thumbColor={value ? color : theme.textSecondary}
      ios_backgroundColor={theme.border}
    />
  </View>
);


const LanguageRow = ({ lang, label, current, onSelect, theme, isLast }) => {
  const isActive = current === lang;
  return (
    <TouchableOpacity
      style={[
        styles.row,
        !isLast && { borderBottomColor: theme.border, borderBottomWidth: 1 },
      ]}
      onPress={() => onSelect(lang)}
      activeOpacity={0.7}
    >
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
      </View>
      <View style={[
        styles.radioOuter,
        { borderColor: isActive ? theme.primary : theme.border },
      ]}>
        {isActive && (
          <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />
        )}
      </View>
    </TouchableOpacity>
  );
};


export default function SettingsScreen() {
  const { theme, t, isDarkTheme, toggleTheme, language, changeLanguage } = useApp();

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
    >

      {}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {t('settingsTitle')}
        </Text>
      </View>

      {}
      <Section title={t('theme')} theme={theme}>
        <SwitchRow
          label={isDarkTheme ? t('darkTheme') : t('lightTheme')}
          subtitle={isDarkTheme
            ? '🌙 Тёмный режим включён'
            : '☀️ Светлый режим включён'
          }
          value={isDarkTheme}
          onValueChange={toggleTheme}
          theme={theme}
          color={theme.primary}
        />
      </Section>

      {}
      <Section title={t('language')} theme={theme}>
        <LanguageRow
          lang="ru"
          label={`🇷🇺  ${t('russian')}`}
          current={language}
          onSelect={changeLanguage}
          theme={theme}
          isLast={false}
        />
        <LanguageRow
          lang="en"
          label={`🇬🇧  ${t('english')}`}
          current={language}
          onSelect={changeLanguage}
          theme={theme}
          isLast={true}
        />
      </Section>

      {}
      <Section title={t('about')} theme={theme}>
        <View style={[styles.row, { borderBottomColor: theme.border }]}>
          <Text style={[styles.rowLabel, { color: theme.text }]}>
            {t('appName')}
          </Text>
          <Text style={[styles.rowValue, { color: theme.textSecondary }]}>
            Habit Tracker
          </Text>
        </View>
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <Text style={[styles.rowLabel, { color: theme.text }]}>
            {t('version')}
          </Text>
          <Text style={[styles.rowValue, { color: theme.textSecondary }]}>
            1.0.0
          </Text>
        </View>
      </Section>

      {}
      <View style={[styles.decorCard, { backgroundColor: theme.primaryLight }]}>
        <Text style={styles.decorEmoji}>🎯</Text>
        <Text style={[styles.decorTitle, { color: theme.primary }]}>
          {t('appName')}
        </Text>
        <Text style={[styles.decorSubtitle, { color: theme.textSecondary }]}>
          Формируй полезные привычки{'\n'}каждый день
        </Text>
      </View>

    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },

  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  rowText: {
    flex: 1,
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 16,
  },
  rowSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  rowValue: {
    fontSize: 15,
  },

  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },

  decorCard: {
    marginHorizontal: 16,
    marginTop: 32,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  decorEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  decorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  decorSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';

import { useApp } from '../context/AppContext';
import { createHabit, updateHabit, getHabitById, isNameDuplicate } from '../database/db';


const COLORS = [
  '#6C63FF', '#FF6584', '#43B97F', '#FF9800',
  '#2196F3', '#E91E63', '#009688', '#FF5722',
];


const FREQUENCIES = ['daily', 'weekly'];


const Field = ({ label, error, theme, children }) => (
  <View style={styles.fieldWrapper}>
    <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
    {children}
    {error ? (
      <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
    ) : null}
  </View>
);


export default function AddHabitScreen({ navigation, route }) {
  const { theme, t, formatDate, parseDate, validateDate, getTodayString } = useApp();

  const editId = route.params?.habitId ?? null;
  const isEdit = !!editId;

  const [loading, setLoading]   = useState(isEdit);
  const [saving, setSaving]     = useState(false);

  const [name, setName]             = useState('');
  const [description, setDescription] = useState('');
  const [goalDays, setGoalDays]     = useState('30');
  const [startDate, setStartDate]   = useState(
    formatDate(getTodayString()) 
  );
  const [frequency, setFrequency]   = useState('daily');
  const [color, setColor]           = useState(COLORS[0]);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      loadHabit();
    }
    navigation.setOptions({
      title: isEdit ? t('editHabit') : t('addHabit'),
    });
  }, []);

  const loadHabit = async () => {
    try {
      const habit = await getHabitById(editId);
      if (habit) {
        setName(habit.name);
        setDescription(habit.description ?? '');
        setGoalDays(habit.goal_days.toString());
        setStartDate(formatDate(habit.start_date));
        setFrequency(habit.frequency);
        setColor(habit.color);
      }
    } catch (error) {
      console.error('loadHabit error:', error);
    } finally {
      setLoading(false);
    }
  };


  const validate = async () => {
    const newErrors = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      newErrors.name = t('errorEmptyName');
    } else if (trimmedName.length > 50) {
      newErrors.name = t('errorLongName');
    } else {
      const duplicate = await isNameDuplicate(trimmedName, isEdit ? editId : null);
      if (duplicate) {
        newErrors.name = t('errorDuplicateName');
      }
    }

    const trimmedGoal = goalDays.trim();
    if (!trimmedGoal) {
      newErrors.goalDays = t('errorEmptyGoal');
    } else {
      const parsed = parseInt(trimmedGoal, 10);
      if (
        isNaN(parsed)        ||
        parsed < 1           ||
        parsed > 365         ||
        trimmedGoal !== String(parsed) 
      ) {
        newErrors.goalDays = t('errorInvalidGoal');
      }
    }

    
    if (!validateDate(startDate)) {
      newErrors.startDate = t('errorInvalidDate');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSave = async () => {
    const isValid = await validate();
    if (!isValid) return;

    setSaving(true);
    try {
      const habitData = {
        name:        name.trim(),
        description: description.trim(),
        goal_days:   parseInt(goalDays.trim(), 10),
        start_date:  parseDate(startDate), 
        frequency,
        color,
      };

      if (isEdit) {
        await updateHabit(editId, habitData);
      } else {
        await createHabit(habitData);
      }

      navigation.goBack();
    } catch (error) {
      console.error('handleSave error:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить привычку');
    } finally {
      setSaving(false);
    }
  };


  const handleDateChange = (text) => {
    let cleaned = text.replace(/[^\d.]/g, '');

    if (
      (cleaned.length === 2 || cleaned.length === 5) &&
      text.length > startDate.length 
    ) {
      cleaned = cleaned + '.';
    }

    if (cleaned.length <= 10) {
      setStartDate(cleaned);
      if (errors.startDate) setErrors((e) => ({ ...e, startDate: null }));
    }
  };


  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {}
        <Field label={t('habitName')} error={errors.name} theme={theme}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBackground,
                color:           theme.text,
                borderColor:     errors.name ? theme.danger : theme.border,
              },
            ]}
            placeholder={t('habitNamePlaceholder')}
            placeholderTextColor={theme.placeholder}
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) setErrors((e) => ({ ...e, name: null }));
            }}
            maxLength={55} 
          />
        </Field>

        {}
        <Field label={t('description')} error={null} theme={theme}>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: theme.inputBackground,
                color:           theme.text,
                borderColor:     theme.border,
              },
            ]}
            placeholder={t('descriptionPlaceholder')}
            placeholderTextColor={theme.placeholder}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            maxLength={200}
          />
        </Field>

        {}
        <Field label={t('goalDays')} error={errors.goalDays} theme={theme}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBackground,
                color:           theme.text,
                borderColor:     errors.goalDays ? theme.danger : theme.border,
              },
            ]}
            placeholder={t('goalDaysPlaceholder')}
            placeholderTextColor={theme.placeholder}
            value={goalDays}
            onChangeText={(text) => {
              
              const digits = text.replace(/[^0-9]/g, '');
              setGoalDays(digits);
              if (errors.goalDays) setErrors((e) => ({ ...e, goalDays: null }));
            }}
            keyboardType="numeric"
            maxLength={3}
          />
        </Field>

        {}
        <Field label={t('startDate')} error={errors.startDate} theme={theme}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBackground,
                color:           theme.text,
                borderColor:     errors.startDate ? theme.danger : theme.border,
              },
            ]}
            placeholder="ДД.ММ.ГГГГ"
            placeholderTextColor={theme.placeholder}
            value={startDate}
            onChangeText={handleDateChange}
            keyboardType="numeric"
            maxLength={10}
          />
        </Field>

        {}
        <Field label={t('frequency')} error={null} theme={theme}>
          <View style={styles.toggleRow}>
            {FREQUENCIES.map((freq) => (
              <TouchableOpacity
                key={freq}
                style={[
                  styles.toggleButton,
                  {
                    backgroundColor:
                      frequency === freq ? theme.primary : theme.inputBackground,
                    borderColor:
                      frequency === freq ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setFrequency(freq)}
              >
                <Text
                  style={{
                    color:      frequency === freq ? '#FFFFFF' : theme.textSecondary,
                    fontWeight: frequency === freq ? '600' : '400',
                    fontSize:   14,
                  }}
                >
                  {t(freq)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        {}
        <Field label={t('color')} error={null} theme={theme}>
          <View style={styles.colorRow}>
            {COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorCircle,
                  { backgroundColor: c },
                  color === c && styles.colorCircleSelected,
                ]}
                onPress={() => setColor(c)}
              >
                {color === c && (
                  <Text style={styles.colorCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        {}
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: saving ? theme.textSecondary : theme.primary },
          ]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>{t('save')}</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  fieldWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  errorText: {
    fontSize: 12,
    marginTop: 5,
  },

  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
    paddingTop: 12,
  },

  toggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },

  colorRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  colorCheck: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  saveButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

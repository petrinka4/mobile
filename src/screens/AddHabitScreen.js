import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, KeyboardAvoidingView,
  Platform, ActivityIndicator, Image,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useAddHabitViewModel } from '../viewmodels/useAddHabitViewModel';

const Field = ({ label, error, theme, children }) => (
  <View style={styles.fieldWrapper}>
    <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
    {children}
    {error ? <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text> : null}
  </View>
);

const handlePickFromGallery = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  if (!result.canceled) {
    const uri = result.assets[0].uri;
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `habit_photos/${Date.now()}.jpg`);
    await uploadBytes(storageRef, blob);
    const downloadUrl = await getDownloadURL(storageRef);
    setPhotoUri(downloadUrl);
  }
};

export default function AddHabitScreen({ navigation, route }) {
  const { theme, t } = useApp();
  const {
    loading, saving,
    name, setName,
    description, setDescription,
    goalDays, setGoalDays,
    startDate, handleDateChange,
    frequency, setFrequency,
    color, setColor,
    errors, setErrors,
    handleSave,
    handlePickImage,
    photoUri,
    COLORS, FREQUENCIES,
  } = useAddHabitViewModel(navigation, route);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <Field label={t('habitName')} error={errors.name} theme={theme}>
          <TextInput
            style={[styles.input, {
              backgroundColor: theme.inputBackground,
              color: theme.text,
              borderColor: errors.name ? theme.danger : theme.border,
            }]}
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

        <Field label={t('description')} error={null} theme={theme}>
          <TextInput
            style={[styles.input, styles.textArea, {
              backgroundColor: theme.inputBackground,
              color: theme.text,
              borderColor: theme.border,
            }]}
            placeholder={t('descriptionPlaceholder')}
            placeholderTextColor={theme.placeholder}
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </Field>

        <Field label={t('goalDays')} error={errors.goalDays} theme={theme}>
          <TextInput
            style={[styles.input, {
              backgroundColor: theme.inputBackground,
              color: theme.text,
              borderColor: errors.goalDays ? theme.danger : theme.border,
            }]}
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

        <Field label={t('startDate')} error={errors.startDate} theme={theme}>
          <TextInput
            style={[styles.input, {
              backgroundColor: theme.inputBackground,
              color: theme.text,
              borderColor: errors.startDate ? theme.danger : theme.border,
            }]}
            placeholder="ДД.ММ.ГГГГ"
            placeholderTextColor={theme.placeholder}
            value={startDate}
            onChangeText={handleDateChange}
            keyboardType="numeric"
            maxLength={10}
          />
        </Field>

        <Field label={t('frequency')} error={null} theme={theme}>
          <View style={styles.toggleRow}>
            {FREQUENCIES.map((freq) => (
              <TouchableOpacity
                key={freq}
                style={[styles.toggleButton, {
                  backgroundColor: frequency === freq ? theme.primary : theme.inputBackground,
                  borderColor: frequency === freq ? theme.primary : theme.border,
                }]}
                onPress={() => setFrequency(freq)}
              >
                <Text style={{ color: frequency === freq ? '#FFFFFF' : theme.textSecondary, fontWeight: '600' }}>
                  {t(freq)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        <Field label={t('color')} error={null} theme={theme}>
          <View style={styles.colorRow}>
            {COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.colorCircle, { backgroundColor: c }, color === c && styles.colorCircleSelected]}
                onPress={() => setColor(c)}
              >
                {color === c && <Text style={styles.colorCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        <Field label="Фото привычки" error={null} theme={theme}>
          <TouchableOpacity
            onPress={handlePickImage}
            style={[styles.photoButton, {
              borderColor: theme.border,
              backgroundColor: theme.inputBackground,
            }]}
          >
            {photoUri
              ? <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              : <Text style={{ color: theme.textSecondary }}>📷 Сделать фото</Text>
            }
          </TouchableOpacity>
        </Field>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.primary }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={styles.saveButtonText}>{t('save')}</Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fieldWrapper: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  errorText: { fontSize: 12, marginTop: 5 },
  input: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  textArea: { height: 90, textAlignVertical: 'top', paddingTop: 12 },
  toggleRow: { flexDirection: 'row', gap: 12 },
  toggleButton: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  colorRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  colorCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  colorCircleSelected: { borderWidth: 3, borderColor: '#FFFFFF', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 },
  colorCheck: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  photoButton: { borderWidth: 1.5, borderRadius: 12, height: 100, justifyContent: 'center', alignItems: 'center' },
  photoPreview: { width: '100%', height: 100, borderRadius: 10 },
  saveButton: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  saveButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: 'bold', letterSpacing: 0.5 },
});
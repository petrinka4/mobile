import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';
import { createHabit, updateHabit, getHabitById, isNameDuplicate } from '../database/db';

const COLORS = ['#6C63FF','#FF6584','#43B97F','#FF9800','#2196F3','#E91E63','#009688','#FF5722'];
const FREQUENCIES = ['daily', 'weekly'];


const CLOUD_NAME = 'dxn7kb7xy';
const UPLOAD_PRESET = 'habit_preset'; 
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export function useAddHabitViewModel(navigation, route) {
  const { t, formatDate, parseDate, validateDate, getTodayString } = useApp();
  const editId = route.params?.habitId ?? null;
  const isEdit = !!editId;

  const [loading, setLoading]       = useState(isEdit);
  const [saving, setSaving]         = useState(false);
  const [name, setName]             = useState('');
  const [description, setDescription] = useState('');
  const [goalDays, setGoalDays]     = useState('30');
  const [startDate, setStartDate]   = useState(formatDate(getTodayString()));
  const [frequency, setFrequency]   = useState('daily');
  const [color, setColor]           = useState(COLORS[0]);
  const [errors, setErrors]         = useState({});
  const [photoUri, setPhotoUri]     = useState(null);

  useEffect(() => {
    if (isEdit) loadHabit();
    navigation.setOptions({ title: isEdit ? t('editHabit') : t('addHabit') });
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
        setPhotoUri(habit.photo_url ?? null);
      }
    } catch (e) {
      console.error('loadHabit error:', e);
    } finally {
      setLoading(false);
    }
  };

  const validate = async () => {
    const newErrors = {};
    const trimmedName = name.trim();
    if (!trimmedName) newErrors.name = t('errorEmptyName');
    else if (trimmedName.length > 50) newErrors.name = t('errorLongName');
    else {
      const dup = await isNameDuplicate(trimmedName, isEdit ? editId : null);
      if (dup) newErrors.name = t('errorDuplicateName');
    }
    const parsed = parseInt(goalDays.trim(), 10);
    if (!goalDays.trim()) newErrors.goalDays = t('errorEmptyGoal');
    else if (isNaN(parsed) || parsed < 1 || parsed > 365) newErrors.goalDays = t('errorInvalidGoal');
    if (!validateDate(startDate)) newErrors.startDate = t('errorInvalidDate');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    const isValid = await validate();
    if (!isValid) return;
    setSaving(true);
    try {
      const habitData = {
        name: name.trim(),
        description: description.trim(),
        goal_days: parseInt(goalDays.trim(), 10),
        start_date: parseDate(startDate),
        frequency,
        color,
        photo_url: photoUri,
      };
      if (isEdit) await updateHabit(editId, habitData);
      else await createHabit(habitData);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось сохранить привычку');
    } finally {
      setSaving(false);
    }
  };

  const handleDateChange = (text) => {
    let cleaned = text.replace(/[^\d.]/g, '');
    if ((cleaned.length === 2 || cleaned.length === 5) && text.length > startDate.length) {
      cleaned = cleaned + '.';
    }
    if (cleaned.length <= 10) {
      setStartDate(cleaned);
      if (errors.startDate) setErrors((e) => ({ ...e, startDate: null }));
    }
  };

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Нет разрешения', 'Разрешите доступ к камере в настройках устройства');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled) return;

      const uri = result.assets[0].uri;

      
      const data = new FormData();
      data.append('file', {
        uri,
        type: 'image/jpeg',
        name: `habit_${Date.now()}.jpg`,
      });
      data.append('upload_preset', UPLOAD_PRESET);

      const res = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: data,
      });

      const json = await res.json();
      if (!res.ok) {
        console.error('Cloudinary upload error:', json);
        Alert.alert('Ошибка', 'Не удалось загрузить фото на сервер');
        return;
      }

      
      setPhotoUri(json.secure_url);
    } catch (e) {
      console.error('handlePickImage error:', e);
      Alert.alert('Ошибка', 'Не удалось загрузить фото');
    }
  };

  return {
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
    isEdit,
  };
}
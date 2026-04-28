import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useApp } from '../context/AppContext';

export default function LoginScreen() {
  const { theme } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Ошибка', 'Введите email и пароль');
      return;
    }
    setLoading(true);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        Alert.alert('✅ Аккаунт создан', 'Вы успешно зарегистрированы!');
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (e) {
      const messages = {
        'auth/email-already-in-use': 'Email уже используется',
        'auth/invalid-email': 'Некорректный email',
        'auth/weak-password': 'Пароль должен быть не менее 6 символов',
        'auth/user-not-found': 'Пользователь не найден',
        'auth/wrong-password': 'Неверный пароль',
      };
      Alert.alert('Ошибка', messages[e.code] ?? e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={[styles.title, { color: theme.text }]}>🎯 Habit Tracker</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        {isRegister ? 'Создать аккаунт' : 'Войти в аккаунт'}
      </Text>

      <TextInput
        style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
        placeholder="Email" placeholderTextColor={theme.placeholder}
        value={email} onChangeText={setEmail}
        autoCapitalize="none" keyboardType="email-address"
      />
      <TextInput
        style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
        placeholder="Пароль" placeholderTextColor={theme.placeholder}
        value={password} onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.primary }]}
        onPress={handleAuth} disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>{isRegister ? 'Зарегистрироваться' : 'Войти'}</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
        <Text style={[styles.switchText, { color: theme.primary }]}>
          {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 32 },
  input: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 16 },
  button: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  switchText: { textAlign: 'center', fontSize: 14, marginTop: 8 },
});
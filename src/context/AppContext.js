import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../localization';
import colors from '../theme/colors';
import * as Network from 'expo-network';
import { auth } from '../firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';


const STORAGE_KEYS = {
  THEME: '@habit_tracker_theme',
  LANGUAGE: '@habit_tracker_language',
};


const AppContext = createContext(null);


export const AppProvider = ({ children }) => {
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [language, setLanguage]       = useState('ru');
  const [isReady, setIsReady]         = useState(false);

  const [isOnline, setIsOnline] = useState(true);
const [user, setUser] = useState(null);
const [authReady, setAuthReady] = useState(false);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
    setUser(firebaseUser);
    setAuthReady(true);
  });
  return unsubscribe;
}, []);

const logout = async () => {
  await signOut(auth);
};


useEffect(() => {
  const checkNetwork = async () => {
    const state = await Network.getNetworkStateAsync();
    setIsOnline(state.isConnected && state.isInternetReachable);
  };
  checkNetwork();
  const interval = setInterval(checkNetwork, 10000); 
  return () => clearInterval(interval);
}, []);

  const theme = isDarkTheme ? colors.dark : colors.light;


  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [savedTheme, savedLanguage] = await AsyncStorage.multiGet([
          STORAGE_KEYS.THEME,
          STORAGE_KEYS.LANGUAGE,
        ]);

        const themeValue    = savedTheme[1];
        const languageValue = savedLanguage[1];

        if (themeValue !== null) {
          setIsDarkTheme(themeValue === 'dark');
        }

        if (languageValue !== null) {
          setLanguage(languageValue);
          i18n.locale = languageValue;
        } else {
          i18n.locale = 'ru';
        }
      } catch (error) {
        console.error('Ошибка загрузки настроек:', error);
      } finally {
        setIsReady(true);
      }
    };

    loadSettings();
  }, []);


  const toggleTheme = async () => {
    try {
      const newValue = !isDarkTheme;
      setIsDarkTheme(newValue);
      await AsyncStorage.setItem(
        STORAGE_KEYS.THEME,
        newValue ? 'dark' : 'light'
      );
    } catch (error) {
      console.error('Ошибка сохранения темы:', error);
    }
  };


  const changeLanguage = async (lang) => {
    try {
      setLanguage(lang);
      i18n.locale = lang;
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
    } catch (error) {
      console.error('Ошибка сохранения языка:', error);
    }
  };


  const t = (key, options) => i18n.t(key, options);


  const getTodayString = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};


  const formatDate = (isoDate) => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}.${month}.${year}`;
  };


  const parseDate = (displayDate) => {
    if (!displayDate) return null;
    const parts = displayDate.split('.');
    if (parts.length !== 3) return null;
    const [day, month, year] = parts;
    return `${year}-${month}-${day}`;
  };


  const validateDate = (displayDate) => {
    
    const regex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
    if (!regex.test(displayDate)) return false;

    const [day, month, year] = displayDate.split('.').map(Number);

    
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31)     return false;
    if (year < 2000 || year > 2100) return false;

    
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth()    !== month - 1 ||
      date.getDate()     !== day
    ) return false;

    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    if (date > maxDate) return false;

    return true;
  };


  const value = {
    
    isDarkTheme,
    toggleTheme,
    theme,

    
    language,
    changeLanguage,
    t,

    
    getTodayString,
    formatDate,
    parseDate,
    validateDate,

    
    isReady,
    isOnline,
    user, authReady, logout,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};



export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp должен использоваться внутри AppProvider');
  }
  return context;
};

export default AppContext;

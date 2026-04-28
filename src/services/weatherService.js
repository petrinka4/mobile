import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY = '6bd9bd3a739bbc27c5152a8e4f9be9ff'; 
const CITY = 'Minsk';
const CACHE_KEY = '@weather_cache';
const CACHE_TTL = 30 * 60 * 1000; 

const WEATHER_ICONS = {
  Clear: '☀️', Clouds: '☁️', Rain: '🌧️',
  Drizzle: '🌦️', Thunderstorm: '⛈️', Snow: '❄️', Mist: '🌫️',
};

export const fetchWeather = async () => {
  try {
    
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) return data;
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}&units=metric&lang=ru`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const json = await response.json();
    const data = {
      city: json.name,
      temp: Math.round(json.main.temp),
      desc: json.weather[0].description,
      icon: WEATHER_ICONS[json.weather[0].main] ?? '🌡️',
    };

    
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    return data;
  } catch (e) {
    
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached).data;
    return null;
  }
};
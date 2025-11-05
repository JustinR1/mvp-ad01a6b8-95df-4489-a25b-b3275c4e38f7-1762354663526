import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator, useColorScheme, Appearance } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const TOKYO_DISTRICTS = {
  'Shibuya': { lat: 35.6595, lon: 139.7004, kanji: '渋谷' },
  'Shinjuku': { lat: 35.6938, lon: 139.7036, kanji: '新宿' },
  'Ginza': { lat: 35.6717, lon: 139.7649, kanji: '銀座' },
  'Harajuku': { lat: 35.6702, lon: 139.7026, kanji: '原宿' },
  'Akihabara': { lat: 35.6984, lon: 139.7731, kanji: '秋葉原' },
  'Roppongi': { lat: 35.6627, lon: 139.7298, kanji: '六本木' },
};

const TRANSLATIONS = {
  ja: {
    loading: '読み込み中...',
    errorTitle: 'エラー',
    errorMessage: 'Weather data could not be loaded. Please try again.',
    today: '今日',
    weekDays: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
    weatherConditions: {
      clear: '晴れ',
      partlyCloudy: '曇り',
      cloudy: '曇天',
      rainy: '雨',
      snowy: '雪',
      thunderstorm: '雷雨',
    },
    high: '最高',
    low: '最低',
    humidity: '湿度',
    windSpeed: '風速',
    feelsLike: '体感温度',
    hourlyForecast: '時間別予報',
    weeklyForecast: '週間予報',
    footer: '東京天気予報 • Tokyo Weather',
  },
  en: {
    loading: 'Loading...',
    errorTitle: 'Error',
    errorMessage: 'Weather data could not be loaded. Please try again.',
    today: 'Today',
    weekDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    weatherConditions: {
      clear: 'Clear',
      partlyCloudy: 'Partly Cloudy',
      cloudy: 'Cloudy',
      rainy: 'Rainy',
      snowy: 'Snowy',
      thunderstorm: 'Thunderstorm',
    },
    high: 'High',
    low: 'Low',
    humidity: 'Humidity',
    windSpeed: 'Wind',
    feelsLike: 'Feels Like',
    hourlyForecast: 'Hourly Forecast',
    weeklyForecast: 'Weekly Forecast',
    footer: 'Tokyo Weather Forecast',
  },
};

export default function App() {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');
  const [language, setLanguage] = useState<'ja' | 'en'>('ja');
  const [location, setLocation] = useState('Shibuya');
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const districts = Object.keys(TOKYO_DISTRICTS);
  const t = TRANSLATIONS[language];

  useEffect(() => {
    setIsDark(systemColorScheme === 'dark');
  }, [systemColorScheme]);

  useEffect(() => {
    fetchWeather();
  }, [location]);

  const toggleTheme = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newTheme = !isDark;
    setIsDark(newTheme);
    Appearance.setColorScheme(newTheme ? 'dark' : 'light');
  };

  const toggleLanguage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLanguage(prev => prev === 'ja' ? 'en' : 'ja');
  };

  const fetchWeather = () => {
    setLoading(true);
    const coords = TOKYO_DISTRICTS[location];
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&temperature_unit=celsius&windspeed_unit=kmh&timezone=Asia/Tokyo`;

    fetch(url)
      .then(response => response.json())
      .then(data => {
        setWeather(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch weather:', error);
        Alert.alert(t.errorTitle, t.errorMessage);
        setLoading(false);
      });
  };

  const changeLocation = () => {
    Haptics.selectionAsync();
    const currentIndex = districts.indexOf(location);
    const nextIndex = (currentIndex + 1) % districts.length;
    setLocation(districts[nextIndex]);
  };

  const getWeatherIcon = (code: number) => {
    if (code === 0) return 'sunny';
    if (code <= 3) return 'partly-sunny';
    if (code <= 48) return 'cloudy';
    if (code <= 67) return 'rainy';
    if (code <= 77) return 'snow';
    return 'thunderstorm';
  };

  const getWeatherDescription = (code: number) => {
    if (code === 0) return t.weatherConditions.clear;
    if (code <= 3) return t.weatherConditions.partlyCloudy;
    if (code <= 48) return t.weatherConditions.cloudy;
    if (code <= 67) return t.weatherConditions.rainy;
    if (code <= 77) return t.weatherConditions.snowy;
    return t.weatherConditions.thunderstorm;
  };

  const currentHour = new Date().getHours();
  const hourlyData = weather?.hourly ?
    Array.from({ length: 6 }, (_, i) => {
      const hour = currentHour + i;
      return {
        time: `${hour}:00`,
        temp: Math.round(weather.hourly.temperature_2m[hour]),
        icon: 'partly-sunny',
      };
    }) : [];

  const dailyData = weather?.daily ?
    Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      return {
        day: i === 0 ? t.today : t.weekDays[date.getDay()],
        high: Math.round(weather.daily.temperature_2m_max[i]),
        low: Math.round(weather.daily.temperature_2m_min[i]),
        rain: weather.daily.precipitation_probability_max[i] || 0,
        icon: getWeatherIcon(weather.daily.weathercode[i]),
      };
    }) : [];

  const currentWeather = weather?.current_weather ? {
    temp: Math.round(weather.current_weather.temperature),
    condition: getWeatherDescription(weather.current_weather.weathercode),
    icon: getWeatherIcon(weather.current_weather.weathercode),
    high: weather.daily?.temperature_2m_max[0] ? Math.round(weather.daily.temperature_2m_max[0]) : 0,
    low: weather.daily?.temperature_2m_min[0] ? Math.round(weather.daily.temperature_2m_min[0]) : 0,
    humidity: weather.hourly?.relativehumidity_2m[currentHour] || 0,
    wind: Math.round(weather.current_weather.windspeed),
    feelsLike: Math.round(weather.current_weather.temperature),
  } : null;

  const colors = isDark ? {
    primary: '#FF1744',
    secondary: '#FF6B9D',
    background: '#000000',
    card: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    border: '#2C2C2E',
  } : {
    primary: '#E91E63',
    secondary: '#F06292',
    background: '#FFF3F8',
    card: '#FFFFFF',
    text: '#1C1C1E',
    textSecondary: '#8E8E93',
    border: '#E5E5EA',
  };

  if (loading || !currentWeather) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient colors={isDark ? ['#1A1A2E', '#16213E'] : [colors.primary, colors.secondary]} style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.loadingText}>{t.loading}</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <LinearGradient colors={isDark ? ['#1A1A2E', '#16213E'] : [colors.primary, colors.secondary]} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.headerContent} onPress={changeLocation}>
            <Ionicons name="location" size={20} color="#FFF" />
            <View style={styles.locationInfo}>
              {language === 'ja' && <Text style={styles.locationKanji}>{TOKYO_DISTRICTS[location].kanji}</Text>}
              <Text style={styles.location}>{location}, Tokyo</Text>
            </View>
            <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.8)" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={toggleLanguage} style={styles.languageButton}>
              <Text style={styles.languageText}>{language === 'ja' ? 'EN' : '日本語'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleTheme} style={styles.themeButton}>
              <Ionicons name={isDark ? 'sunny' : 'moon'} size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.currentWeatherContainer}>
          <Ionicons name={currentWeather.icon as any} size={80} color="#FFF" style={styles.weatherIcon} />
          <Text style={styles.temp}>{currentWeather.temp}°</Text>
        </View>
        <Text style={styles.condition}>{currentWeather.condition}</Text>
        <Text style={styles.highLow}>
          {t.high}:{currentWeather.high}° {t.low}:{currentWeather.low}°
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.detailItem}>
            <Ionicons name="water" size={24} color={colors.primary} />
            <Text style={[styles.detailValue, { color: colors.text }]}>{currentWeather.humidity}%</Text>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t.humidity}</Text>
          </View>
          <View style={[styles.detailItem, styles.detailItemBorder, { borderLeftColor: colors.border, borderRightColor: colors.border }]}>
            <Ionicons name="speedometer" size={24} color={colors.primary} />
            <Text style={[styles.detailValue, { color: colors.text }]}>{currentWeather.wind} km/h</Text>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t.windSpeed}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="thermometer" size={24} color={colors.primary} />
            <Text style={[styles.detailValue, { color: colors.text }]}>{currentWeather.feelsLike}°</Text>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t.feelsLike}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.hourlyForecast}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyScroll}>
            {hourlyData.map((hour, i) => (
              <View key={i} style={[styles.hourlyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.hourlyTime, { color: colors.textSecondary }]}>{hour.time}</Text>
                <Ionicons name={hour.icon as any} size={32} color={colors.primary} />
                <Text style={[styles.hourlyTemp, { color: colors.text }]}>{hour.temp}°</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.weeklyForecast}</Text>
          {dailyData.map((day, i) => (
            <View key={i} style={[styles.weeklyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.dayName, { color: colors.text }]}>{day.day}</Text>
              <View style={styles.weeklyCenter}>
                <Ionicons name={day.icon as any} size={28} color={colors.primary} />
                <View style={styles.rainInfo}>
                  <Ionicons name="water" size={12} color={colors.primary} />
                  <Text style={[styles.rainText, { color: colors.primary }]}>{day.rain}%</Text>
                </View>
              </View>
              <View style={styles.tempRange}>
                <Text style={[styles.tempHigh, { color: colors.text }]}>{day.high}°</Text>
                <Text style={[styles.tempLow, { color: colors.textSecondary }]}>{day.low}°</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>{t.footer}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  header: { padding: 30, paddingTop: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  locationInfo: { marginLeft: 8 },
  locationKanji: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  location: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  languageButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },
  languageText: { fontSize: 12, fontWeight: '600', color: '#FFF' },
  themeButton: { padding: 8 },
  currentWeatherContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 10 },
  weatherIcon: { marginRight: 16 },
  temp: { fontSize: 72, fontWeight: '200', color: '#FFF' },
  condition: { fontSize: 24, color: 'rgba(255,255,255,0.9)', marginTop: 8, textAlign: 'center' },
  highLow: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 8, textAlign: 'center' },
  content: { flex: 1, marginTop: -20 },
  detailsCard: { flexDirection: 'row', margin: 20, padding: 20, borderRadius: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  detailItem: { flex: 1, alignItems: 'center' },
  detailItemBorder: { borderLeftWidth: 1, borderRightWidth: 1 },
  detailValue: { fontSize: 18, fontWeight: '600', marginTop: 8 },
  detailLabel: { fontSize: 12, marginTop: 4 },
  section: { marginHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  hourlyScroll: { marginLeft: -20 },
  hourlyCard: { padding: 16, borderRadius: 12, marginLeft: 12, alignItems: 'center', minWidth: 70, borderWidth: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  hourlyTime: { fontSize: 14, marginBottom: 8 },
  hourlyTemp: { fontSize: 16, fontWeight: '600', marginTop: 8 },
  weeklyCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  dayName: { flex: 1, fontSize: 16, fontWeight: '600' },
  weeklyCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rainInfo: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  rainText: { fontSize: 12 },
  tempRange: { flexDirection: 'row', gap: 8, marginLeft: 16 },
  tempHigh: { fontSize: 16, fontWeight: '600' },
  tempLow: { fontSize: 16 },
  footer: { alignItems: 'center', paddingVertical: 30 },
  footerText: { fontSize: 14 },
});
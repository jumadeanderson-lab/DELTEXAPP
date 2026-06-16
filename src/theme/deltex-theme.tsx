import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemePalette {
  mode: ResolvedTheme;
  background: string;
  backgroundSoft: string;
  surface: string;
  surfaceStrong: string;
  card: string;
  cardAlt: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  border: string;
  primary: string;
  accent: string;
  danger: string;
  warning: string;
  success: string;
  purple: string;
  shadow: string;
  input: string;
  tab: string;
}

interface ThemeContextValue {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  colors: ThemePalette;
  setPreference: (preference: ThemePreference) => Promise<void>;
}

const THEME_KEY = 'deltex_ai_theme_preference';

const DARK: ThemePalette = {
  mode: 'dark',
  background: '#0a0c12',
  backgroundSoft: '#0d1018',
  surface: '#111420',
  surfaceStrong: '#161929',
  card: '#111420',
  cardAlt: '#1a1f30',
  text: '#e8eaf0',
  textMuted: '#9aa3b8',
  textSubtle: '#6b7280',
  border: 'rgba(0,212,255,0.12)',
  primary: '#00d4ff',
  accent: '#0ff4c6',
  danger: '#ff3b5c',
  warning: '#f59e0b',
  success: '#22c55e',
  purple: '#7c3aed',
  shadow: 'rgba(0,212,255,0.35)',
  input: '#161929',
  tab: 'rgba(10,12,18,0.94)',
};

const LIGHT: ThemePalette = {
  mode: 'light',
  background: '#f6fbff',
  backgroundSoft: '#eef7ff',
  surface: '#ffffff',
  surfaceStrong: '#e9f5ff',
  card: '#ffffff',
  cardAlt: '#f4f8ff',
  text: '#07111f',
  textMuted: '#475569',
  textSubtle: '#718096',
  border: 'rgba(0,106,166,0.16)',
  primary: '#006dff',
  accent: '#02bfa6',
  danger: '#dc2626',
  warning: '#d97706',
  success: '#059669',
  purple: '#6d28d9',
  shadow: 'rgba(0,109,255,0.22)',
  input: '#edf6ff',
  tab: 'rgba(255,255,255,0.94)',
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

async function getStoredPreference() {
  if (Platform.OS === 'web') {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(THEME_KEY);
  }

  return SecureStore.getItemAsync(THEME_KEY);
}

async function setStoredPreference(preference: ThemePreference) {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_KEY, preference);
    }
    return;
  }

  await SecureStore.setItemAsync(THEME_KEY, preference);
}

export function DeltexThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('light');

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      const stored = await getStoredPreference();
      if (mounted && (stored === 'light' || stored === 'dark' || stored === 'system')) {
        setPreferenceState(stored);
      }
    }

    hydrate();

    return () => {
      mounted = false;
    };
  }, []);

  const setPreference = useCallback(async (nextPreference: ThemePreference) => {
    setPreferenceState(nextPreference);
    await setStoredPreference(nextPreference);
  }, []);

  const resolvedTheme: ResolvedTheme =
    preference === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : preference;

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      resolvedTheme,
      colors: resolvedTheme === 'light' ? LIGHT : DARK,
      setPreference,
    }),
    [preference, resolvedTheme, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useDeltexTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useDeltexTheme must be used within DeltexThemeProvider');
  }

  return context;
}

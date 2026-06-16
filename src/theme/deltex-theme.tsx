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
  background: '#08080a',
  backgroundSoft: '#0d0d11',
  surface: '#111114',
  surfaceStrong: '#18181d',
  card: '#111114',
  cardAlt: '#17171c',
  text: '#f4f2ed',
  textMuted: '#b7b2a8',
  textSubtle: '#7a766e',
  border: 'rgba(255,255,255,0.10)',
  primary: '#78f27f',
  accent: '#c084fc',
  danger: '#ff6b7a',
  warning: '#facc15',
  success: '#7ee787',
  purple: '#a78bfa',
  shadow: 'rgba(126,231,135,0.22)',
  input: '#16161a',
  tab: 'rgba(8,8,10,0.92)',
};

const LIGHT: ThemePalette = {
  mode: 'light',
  background: '#f7f6f2',
  backgroundSoft: '#efeee8',
  surface: '#ffffff',
  surfaceStrong: '#eeece5',
  card: '#ffffff',
  cardAlt: '#f3f1eb',
  text: '#171714',
  textMuted: '#5f5b52',
  textSubtle: '#8b867a',
  border: 'rgba(23,23,20,0.12)',
  primary: '#198f3b',
  accent: '#6d28d9',
  danger: '#dc2626',
  warning: '#b7791f',
  success: '#15803d',
  purple: '#6d28d9',
  shadow: 'rgba(25,143,59,0.16)',
  input: '#f1efe8',
  tab: 'rgba(247,246,242,0.94)',
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
  const [preference, setPreferenceState] = useState<ThemePreference>('dark');

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

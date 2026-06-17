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
  background: '#050608',
  backgroundSoft: '#090b10',
  surface: '#0d1117',
  surfaceStrong: '#151922',
  card: '#0b0d12',
  cardAlt: '#111827',
  text: '#f8fafc',
  textMuted: '#a9b4c2',
  textSubtle: '#667085',
  border: 'rgba(255,255,255,0.12)',
  primary: '#2563eb',
  accent: '#60a5fa',
  danger: '#ff6b7a',
  warning: '#facc15',
  success: '#22c55e',
  purple: '#8b5cf6',
  shadow: 'rgba(37,99,235,0.24)',
  input: '#111827',
  tab: 'rgba(5,6,8,0.92)',
};

const LIGHT: ThemePalette = {
  mode: 'light',
  background: '#f8fafc',
  backgroundSoft: '#eef2f7',
  surface: '#ffffff',
  surfaceStrong: '#e5e7eb',
  card: '#ffffff',
  cardAlt: '#f1f5f9',
  text: '#0f172a',
  textMuted: '#475569',
  textSubtle: '#94a3b8',
  border: 'rgba(15,23,42,0.12)',
  primary: '#2563eb',
  accent: '#1d4ed8',
  danger: '#dc2626',
  warning: '#b7791f',
  success: '#16a34a',
  purple: '#7c3aed',
  shadow: 'rgba(37,99,235,0.16)',
  input: '#f8fafc',
  tab: 'rgba(248,250,252,0.94)',
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

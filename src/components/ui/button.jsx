import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from '../themed-text';

const PRIMARY_BUTTON = '#2563eb';
const PRIMARY_BUTTON_PRESSED = '#1d4ed8';

export function Button({
  title,
  onPress,
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}) {
  useTheme();
  const [clicked, setClicked] = useState(false);
  const timerRef = useRef(null);
  const busy = loading || clicked;

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  async function handlePress() {
    if (disabled || busy) return;

    setClicked(true);
    if (timerRef.current) clearTimeout(timerRef.current);

    try {
      await Promise.resolve(onPress?.());
    } finally {
      timerRef.current = setTimeout(() => setClicked(false), 520);
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: pressed ? PRIMARY_BUTTON_PRESSED : PRIMARY_BUTTON },
        fullWidth && styles.fullWidth,
        (pressed || disabled) && styles.pressed,
        style,
      ]}
    >
      {busy ? <ActivityIndicator color="#ffffff" size="small" /> : <ThemedText style={styles.buttonText}>{title}</ThemedText>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    borderWidth: 0,
    minHeight: 48,
    paddingHorizontal: 32,
    paddingVertical: 12,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
});

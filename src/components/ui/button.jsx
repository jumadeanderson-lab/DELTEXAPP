import { Platform, Pressable, StyleSheet } from 'react-native';

import { Spacing, ButtonBorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from '../themed-text';

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}) {
  const theme = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? theme.textSecondary : theme.primary,
          borderColor: disabled ? theme.textSecondary : theme.primary,
        };
      case 'secondary':
        return {
          backgroundColor: theme.primaryBackground,
          borderColor: theme.primary,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: disabled ? theme.textSecondary : theme.primary,
          borderWidth: 1,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
      case 'danger':
        return {
          backgroundColor: disabled ? theme.textSecondary : theme.danger,
          borderColor: disabled ? theme.textSecondary : theme.danger,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: Spacing.three,
          paddingVertical: Spacing.one,
          minHeight: 32,
        };
      case 'md':
        return {
          paddingHorizontal: Spacing.four,
          paddingVertical: Spacing.two,
          minHeight: 40,
        };
      case 'lg':
        return {
          paddingHorizontal: Spacing.four,
          paddingVertical: Spacing.three,
          minHeight: 48,
        };
    }
  };

  const getTextColor = () => {
    if (variant === 'primary' || variant === 'danger') {
      return '#FFFFFF';
    }
    if (variant === 'outline') {
      return disabled ? theme.textSecondary : theme.primary;
    }
    if (variant === 'ghost') {
      return disabled ? theme.textSecondary : theme.primary;
    }
    return theme.primary;
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        getVariantStyles(),
        getSizeStyles(),
        fullWidth && styles.fullWidth,
        (pressed || disabled) && styles.pressed,
        style,
      ]}
    >
      <ThemedText
        style={{
          color: getTextColor(),
          fontWeight: '600',
          textAlign: 'center',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {loading ? 'Loading...' : title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ButtonBorderRadius,
    flexDirection: 'row',
    gap: Spacing.two,
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
});

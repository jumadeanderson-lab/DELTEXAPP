import { StyleSheet, View } from 'react-native';

import { Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from '../themed-text';

export function Badge({ label, variant = 'default', size = 'md', style }) {
  const theme = useTheme();

  const getBackgroundColor = () => {
    switch (variant) {
      case 'success':
        return theme.successBackground;
      case 'warning':
        return theme.warningBackground;
      case 'danger':
        return theme.dangerBackground;
      case 'info':
        return theme.infoBackground;
      case 'premium':
        return 'rgba(88, 80, 236, 0.1)'; // Purple for premium
      default:
        return theme.backgroundElement;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'success':
        return theme.success;
      case 'warning':
        return theme.warning;
      case 'danger':
        return theme.danger;
      case 'info':
        return theme.info;
      case 'premium':
        return '#5850EC';
      default:
        return theme.text;
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: Spacing.two,
          paddingVertical: Spacing.half,
        };
      case 'md':
        return {
          paddingHorizontal: Spacing.three,
          paddingVertical: Spacing.one,
        };
    }
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: getBackgroundColor(),
        },
        getPadding(),
        style,
      ]}
    >
      <ThemedText
        style={{
          fontSize: size === 'sm' ? 12 : 13,
          color: getTextColor(),
          fontWeight: '600',
        }}
      >
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
});

import { StyleSheet, View } from 'react-native';

import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from '../themed-text';

export function ProgressBar({
  value,
  label,
  showPercentage = true,
  color,
  style,
  size = 'md',
}) {
  const theme = useTheme();
  const clampedValue = Math.min(100, Math.max(0, value));

  const getHeight = () => {
    switch (size) {
      case 'sm':
        return 4;
      case 'md':
        return 8;
      case 'lg':
        return 12;
    }
  };

  const getColor = () => {
    if (color) return color;
    if (clampedValue >= 75) return theme.success;
    if (clampedValue >= 50) return theme.primary;
    if (clampedValue >= 25) return theme.warning;
    return theme.danger;
  };

  return (
    <View style={style}>
      {label && (
        <View style={styles.header}>
          <ThemedText style={styles.label}>{label}</ThemedText>
          {showPercentage && (
            <ThemedText style={styles.percentage}>{clampedValue}%</ThemedText>
          )}
        </View>
      )}
      <View
        style={[
          styles.track,
          {
            backgroundColor: theme.backgroundSelected,
            height: getHeight(),
            borderRadius: BorderRadius.full,
          },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${clampedValue}%`,
              backgroundColor: getColor(),
              height: getHeight(),
              borderRadius: BorderRadius.full,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  percentage: {
    fontSize: 13,
    fontWeight: '600',
  },
  track: {
    overflow: 'hidden',
  },
  fill: {
    // Transition is not supported in React Native
    // Use Animated API for smooth transitions if needed
  },
});

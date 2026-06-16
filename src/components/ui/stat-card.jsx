import { StyleSheet, View } from 'react-native';

import { CardBorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from '../themed-text';
export function StatCard({
  title,
  value,
  icon,
  trend,
  trendValue,
  color = 'primary',
  style,
}) {
  const theme = useTheme();

  const getTrendColor = () => {
    switch (color) {
      case 'success':
        return theme.success;
      case 'warning':
        return theme.warning;
      case 'danger':
        return theme.danger;
      default:
        return theme.primary;
    }
  };

  const getTrendIcon = () => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
        },
        style,
      ]}
    >
      <View style={styles.header}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        {icon && <ThemedText style={styles.icon}>{icon}</ThemedText>}
      </View>

      <ThemedText style={styles.value}>{value}</ThemedText>

      {trend && trendValue && (
        <View style={styles.trendContainer}>
          <ThemedText
            style={[
              styles.trendText,
              {
                color: getTrendColor(),
              },
            ]}
          >
            {getTrendIcon()} {trendValue}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: CardBorderRadius,
    padding: Spacing.three,
    borderWidth: 1,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  icon: {
    fontSize: 24,
  },
  value: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: Spacing.one,
  },
  trendContainer: {
    marginTop: Spacing.two,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

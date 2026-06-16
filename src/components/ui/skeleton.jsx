import { StyleSheet, View } from 'react-native';

import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Skeleton({ width = '100%', height = 16, borderRadius = BorderRadius.md, style }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.skeleton,
        {
          width: width,
          height,
          borderRadius,
          backgroundColor: theme.backgroundSelected,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard({ lines = 3, style }) {
  const theme = useTheme();

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
      {/* Title skeleton */}
      <Skeleton height={20} width="60%" style={{ marginBottom: Spacing.two }} />

      {/* Content skeletons */}
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={12}
          width={i === lines - 1 ? '80%' : '100%'}
          style={{ marginBottom: Spacing.two }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    opacity: 0.6,
  },
  card: {
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
});

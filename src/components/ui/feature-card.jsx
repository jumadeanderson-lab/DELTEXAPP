import { Pressable, StyleSheet, View } from 'react-native';

import { CardBorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from '../themed-text';
import { Badge } from './badge';

export function FeatureCard({
  title,
  description,
  icon,
  locked = false,
  premium,
  onUpgrade,
  style,
  children,
}) {
  const theme = useTheme();

  const getPremiumPlanLabel = () => {
    switch (premium) {
      case 'standard':
        return 'Standard+';
      case 'enterprise':
        return 'Enterprise';
      default:
        return 'Premium';
    }
  };

  return (
    <Pressable
      onPress={locked && onUpgrade ? onUpgrade : undefined}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
          opacity: pressed && locked ? 0.8 : 1,
        },
        locked && { opacity: 0.7 },
        style,
      ]}
    >
      <View style={styles.header}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <View style={styles.titleContainer}>
          <ThemedText style={styles.title}>{title}</ThemedText>
          {locked && premium && (
            <Badge
              label={getPremiumPlanLabel()}
              variant="premium"
              size="sm"
              style={{ marginTop: Spacing.one }}
            />
          )}
        </View>
      </View>

      {description && (
        <ThemedText style={styles.description}>{description}</ThemedText>
      )}

      {locked && onUpgrade && (
        <Pressable
          onPress={onUpgrade}
          style={({ pressed }) => [
            styles.upgradeButton,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <ThemedText
            style={{
              color: theme.primary,
              fontWeight: '600',
              fontSize: 13,
            }}
          >
            Upgrade Now →
          </ThemedText>
        </Pressable>
      )}

      {!locked && children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: CardBorderRadius,
    padding: Spacing.three,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  icon: {
    marginTop: Spacing.one,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
    fontSize: 16,
  },
  description: {
    fontSize: 14,
    marginTop: Spacing.two,
  },
  upgradeButton: {
    marginTop: Spacing.two,
    paddingVertical: Spacing.one,
  },
});

import { StyleSheet, View } from 'react-native';

import { CardBorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from '../themed-text';
import { Badge } from './badge';
import { Button } from './button';

export function PricingCard({
  planName,
  price,
  billing,
  description,
  features,
  highlighted = false,
  onSelect,
  buttonText = 'Select Plan',
  style,
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: highlighted ? theme.primary : theme.border,
          borderWidth: highlighted ? 2 : 1,
          transform: highlighted ? [{ scale: 1.02 }] : [{ scale: 1 }],
        },
        style,
      ]}
    >
      {highlighted && (
        <Badge
          label="Recommended"
          variant="info"
          style={{ marginBottom: Spacing.two }}
        />
      )}

      <ThemedText style={styles.planName}>{planName}</ThemedText>

      <View style={styles.priceSection}>
        <ThemedText style={styles.price}>{price}</ThemedText>
        {billing && (
          <ThemedText style={styles.billing}>{billing}</ThemedText>
        )}
      </View>

      {description && (
        <ThemedText style={styles.description}>{description}</ThemedText>
      )}

      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <ThemedText style={styles.checkmark}>Yes</ThemedText>
            <ThemedText style={styles.featureText}>{feature}</ThemedText>
          </View>
        ))}
      </View>

      <Button
        title={buttonText}
        onPress={onSelect}
        variant={highlighted ? 'primary' : 'outline'}
        fullWidth
        style={{ marginTop: Spacing.three }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: CardBorderRadius,
    padding: Spacing.four,
    minWidth: 280,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.one,
  },
  priceSection: {
    marginBottom: Spacing.three,
  },
  price: {
    fontSize: 36,
    fontWeight: '700',
  },
  billing: {
    fontSize: 14,
    marginTop: Spacing.one,
  },
  description: {
    fontSize: 13,
    marginBottom: Spacing.three,
  },
  featuresContainer: {
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '700',
  },
  featureText: {
    fontSize: 13,
    flex: 1,
  },
});

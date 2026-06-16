import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';

import { ThemedText } from '../themed-text';
import { Button } from './button';

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  style,
}) {
  return (
    <View style={[styles.container, style]}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <ThemedText style={styles.title}>{title}</ThemedText>
      {description && <ThemedText style={styles.description}>{description}</ThemedText>}
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          style={{ marginTop: Spacing.three }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.four,
  },
  icon: {
    marginBottom: Spacing.three,
    fontSize: 48,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.one,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
});

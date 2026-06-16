import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from '../themed-text';

export function Divider({ style, vertical = false }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.divider,
        vertical && styles.verticalDivider,
        {
          backgroundColor: theme.border,
        },
        style,
      ]}
    />
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
  style,
}) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <View style={{ flex: 1 }}>
        <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
        {subtitle && (
          <ThemedText style={styles.sectionSubtitle}>{subtitle}</ThemedText>
        )}
      </View>
      {action && <View>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    width: '100%',
  },
  verticalDivider: {
    width: 1,
    height: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: Spacing.one,
  },
});

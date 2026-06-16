import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from '../themed-text';

export function StatusIndicator({ status, label, size = 'md', style }) {
  const theme = useTheme();

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return theme.success;
      case 'warning':
        return theme.warning;
      case 'danger':
        return theme.danger;
      case 'active':
        return theme.primary;
      case 'idle':
        return theme.textTertiary;
    }
  };

  const getDotSize = () => {
    switch (size) {
      case 'sm':
        return 8;
      case 'md':
        return 12;
      case 'lg':
        return 16;
    }
  };

  const dotSize = getDotSize();

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            backgroundColor: getStatusColor(),
          },
        ]}
      />
      {label && (
        <ThemedText
          style={{
            fontSize: size === 'sm' ? 12 : 14,
            marginLeft: Spacing.one,
          }}
        >
          {label}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    borderRadius: 9999,
  },
});

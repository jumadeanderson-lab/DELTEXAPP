import { StyleSheet, View } from 'react-native';

import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from '../themed-text';

export function Alert({ type, title, message, style }) {
  const theme = useTheme();

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          background: theme.successBackground,
          border: theme.success,
          text: theme.success,
        };
      case 'warning':
        return {
          background: theme.warningBackground,
          border: theme.warning,
          text: theme.warning,
        };
      case 'danger':
        return {
          background: theme.dangerBackground,
          border: theme.danger,
          text: theme.danger,
        };
      case 'info':
        return {
          background: theme.infoBackground,
          border: theme.info,
          text: theme.info,
        };
    }
  };

  const colors = getColors();

  return (
    <View
      style={[
        styles.alert,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
          borderLeftColor: colors.border,
        },
        style,
      ]}
    >
      {title && (
        <ThemedText
          style={{
            color: colors.text,
            fontWeight: '600',
            marginBottom: Spacing.one,
          }}
        >
          {title}
        </ThemedText>
      )}
      <ThemedText
        style={{
          color: colors.text,
          fontSize: 14,
        }}
      >
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  alert: {
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
});

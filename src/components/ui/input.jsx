import { StyleSheet, TextInput, View } from 'react-native';

import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from '../themed-text';

export function Input({
  label,
  error,
  hint,
  containerStyle,
  ...props
}) {
  const theme = useTheme();

  return (
    <View style={containerStyle}>
      {label && (
        <ThemedText style={styles.label}>{label}</ThemedText>
      )}

      <TextInput
        {...props}
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.backgroundElement,
            borderColor: error ? theme.danger : theme.border,
          },
        ]}
        placeholderTextColor={theme.textSecondary}
      />

      {error && (
        <ThemedText
          style={[
            styles.error,
            {
              color: theme.danger,
            },
          ]}
        >
          {error}
        </ThemedText>
      )}

      {hint && !error && (
        <ThemedText
          style={[
            styles.hint,
            {
              color: theme.textSecondary,
            },
          ]}
        >
          {hint}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  error: {
    fontSize: 12,
    marginTop: Spacing.one,
    fontWeight: '500',
  },
  hint: {
    fontSize: 12,
    marginTop: Spacing.one,
  },
});

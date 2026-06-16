import { StyleSheet, View } from 'react-native';

import { CardBorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Card({ children, style, variant = 'default' }) {
  const theme = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
          borderWidth: 1,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        };
      case 'outline':
        return {
          backgroundColor: theme.background,
          borderColor: theme.border,
          borderWidth: 1,
        };
      default:
        return {
          backgroundColor: theme.backgroundElement,
          borderColor: 'transparent',
        };
    }
  };

  return (
    <View
      style={[
        styles.card,
        getVariantStyles(),
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: CardBorderRadius,
    padding: Spacing.four,
  },
});

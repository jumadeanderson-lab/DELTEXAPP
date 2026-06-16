import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';

export function Stack({
  children,
  direction = 'vertical',
  spacing = 'three',
  align = 'stretch',
  justify = 'flex-start',
  style,
}) {
  const isRow = direction === 'horizontal';

  return (
    <View
      style={[
        styles.stack,
        {
          flexDirection: isRow ? 'row' : 'column',
          gap: Spacing[spacing],
          alignItems: align,
          justifyContent: justify,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {},
});

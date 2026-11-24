import { StyleSheet, Text } from 'react-native';

import { colors, fonts, neonGlow } from '../theme';

/** «REPEAT» en letra pixelada cian con brillo neón. */
export function Logo({ size = 24 }: { size?: number }) {
  return (
    <Text accessibilityRole="header" style={[styles.logo, { fontSize: size }]}>
      REPEAT
    </Text>
  );
}

const styles = StyleSheet.create({
  logo: { fontFamily: fonts.logo, letterSpacing: 1, color: colors.cyan, ...neonGlow },
});

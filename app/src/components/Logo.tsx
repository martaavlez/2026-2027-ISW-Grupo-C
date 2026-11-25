import { Text } from 'react-native';

import { fonts, useColors } from '../theme';

/** «HERTZ» en Archivo condensada. */
export function Logo({ size = 30 }: { size?: number }) {
  const colors = useColors();
  return (
    <Text
      accessibilityRole="header"
      style={{
        fontFamily: fonts.display,
        fontSize: size,
        lineHeight: size * 0.86,
        letterSpacing: -0.02 * size,
        color: colors.ink,
      }}
    >
      HERTZ
    </Text>
  );
}

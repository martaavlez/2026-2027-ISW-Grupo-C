import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { Colors, fonts, offsetShadow, useColors } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'dark';
  disabled?: boolean;
  loading?: boolean;
};

function variantStyle(colors: Colors, variant: NonNullable<Props['variant']>) {
  if (variant === 'primary') return { backgroundColor: colors.accent, ...offsetShadow(colors, 3) };
  if (variant === 'dark') return { backgroundColor: colors.ink };
  return { backgroundColor: 'transparent' };
}

/**
 * Botón principal (rosa con sombra), secundario (solo borde) u oscuro (tinta).
 * Al pulsar el principal, se desplaza 3 px y pierde la sombra.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}: Props) {
  const colors = useColors();
  const inactive = disabled || loading;
  const textColor =
    variant === 'primary' ? colors.onAccent : variant === 'dark' ? colors.background : colors.ink;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { borderColor: colors.ink },
        variantStyle(colors, variant),
        pressed && variant === 'primary' ? styles.pressed : null,
        inactive ? styles.inactive : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { transform: [{ translateX: 3 }, { translateY: 3 }], boxShadow: 'none' },
  inactive: { opacity: 0.5 },
  text: { fontFamily: fonts.bodyBold, fontSize: 16 },
});

import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
};

/** Botón principal (cian con borde y sombra rosa) o secundario (solo borde). */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}: Props) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={[styles.base, styles[variant], inactive ? styles.inactive : null]}
    >
      {loading ? (
        <ActivityIndicator color={colors.onCyan} />
      ) : (
        <Text style={variant === 'primary' ? styles.primaryText : styles.secondaryText}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 48, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  primary: {
    backgroundColor: colors.cyan,
    borderWidth: 3,
    borderColor: colors.pink,
    boxShadow: `4px 4px 0 ${colors.pink}, 0 0 16px rgba(0, 240, 255, 0.45)`,
  },
  secondary: { minHeight: 44, borderWidth: 2, borderColor: colors.border },
  inactive: { opacity: 0.5 },
  primaryText: { fontFamily: fonts.heading, fontSize: 16, color: colors.onCyan },
  secondaryText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from '../theme';

type Props = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
};

export function Checkbox({ label, checked, onChange, error }: Props) {
  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityState={{ checked }}
        onPress={() => onChange(!checked)}
        style={styles.row}
      >
        <View style={[styles.box, checked ? styles.checked : null, error ? styles.boxError : null]}>
          {checked ? <Text style={styles.tick}>✓</Text> : null}
        </View>
        <Text style={styles.label}>{label}</Text>
      </Pressable>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md - 4 },
  box: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: { backgroundColor: colors.cyan, borderColor: colors.cyan },
  boxError: { borderColor: colors.pink },
  tick: { color: colors.onCyan, fontSize: 14, fontWeight: '700' },
  label: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
  error: { fontFamily: fonts.body, fontSize: 13, color: colors.pink },
});

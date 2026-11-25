import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts, spacing, useColors } from '../theme';

type Props = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
};

export function Checkbox({ label, checked, onChange, error }: Props) {
  const colors = useColors();
  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityState={{ checked }}
        onPress={() => onChange(!checked)}
        style={styles.row}
      >
        <View
          style={[
            styles.box,
            { borderColor: error ? colors.accent : colors.ink },
            checked ? { backgroundColor: colors.ink } : null,
          ]}
        >
          {checked ? <Text style={[styles.tick, { color: colors.background }]}>✓</Text> : null}
        </View>
        <Text style={[styles.label, { color: colors.ink }]}>{label}</Text>
      </Pressable>
      {error ? (
        <Text accessibilityRole="alert" style={[styles.error, { color: colors.accentText }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  box: {
    width: 20,
    height: 20,
    marginTop: 1,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: { fontSize: 12, fontWeight: '800', lineHeight: 14 },
  label: { flex: 1, fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  error: { fontFamily: fonts.body, fontSize: 13 },
});

import { StyleSheet, Text, View } from 'react-native';

import { fonts, useColors } from '../theme';

/** Lista de datos «Tipo · Año · Género…» de la ficha. Los datos que faltan no se muestran. */
export function InfoList({ items }: { items: [string, string | null | undefined][] }) {
  const colors = useColors();
  return (
    <View style={[styles.list, { borderTopColor: colors.ink }]}>
      {items
        .filter(([, value]) => value)
        .map(([label, value]) => (
          <View key={label} style={styles.row}>
            <Text style={[styles.text, styles.label, { color: colors.ink }]}>{label}</Text>
            <Text style={[styles.text, styles.value, { color: colors.ink }]}>{value}</Text>
          </View>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { borderTopWidth: 2, paddingTop: 16, gap: 8 },
  row: { flexDirection: 'row' },
  text: { fontFamily: fonts.mono, fontSize: 12 },
  label: { width: 110 },
  value: { flex: 1 },
});

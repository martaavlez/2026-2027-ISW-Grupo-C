import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatCount } from '../features/catalog/format';
import { fonts, useColors } from '../theme';

/** «Ver más» al final de una lista larga: dice cuántos faltan. */
export function MoreButton({
  label,
  remaining,
  loading,
  error,
  onPress,
}: {
  label: string;
  remaining: number;
  loading: boolean;
  error: string | null;
  onPress: () => void;
}) {
  const colors = useColors();
  if (remaining === 0) return null;
  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ busy: loading, disabled: loading }}
        disabled={loading}
        onPress={onPress}
        style={[styles.button, { borderColor: colors.ink, backgroundColor: colors.background }]}
      >
        {loading ? (
          <ActivityIndicator color={colors.ink} accessibilityLabel="Cargando" />
        ) : (
          <Text style={[styles.text, { color: colors.ink }]}>
            {label} ({formatCount(remaining)})
          </Text>
        )}
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
  wrapper: { marginTop: 14, gap: 8, alignItems: 'flex-start' },
  button: { borderWidth: 2, paddingVertical: 10, paddingHorizontal: 18, minHeight: 44 },
  text: { fontFamily: fonts.monoMedium, fontSize: 13 },
  error: { fontFamily: fonts.body, fontSize: 14 },
});

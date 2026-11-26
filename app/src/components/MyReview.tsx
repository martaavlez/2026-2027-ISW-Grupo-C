import { StyleSheet, Text, View } from 'react-native';

import type { Privacy } from '../services/api';
import { fonts, useColors } from '../theme';
import { PRIVACY_LABELS } from './ReviewComposer';

/** Cuando ya ha publicado su reseña: se la enseña con quién la ve. Editarla llega con la HU-08. */
export function MyReview({ body, privacy }: { body: string; privacy: Privacy }) {
  const colors = useColors();
  return (
    <View style={styles.box}>
      <Text style={[styles.label, { color: colors.ink }]}>
        TU RESEÑA · {PRIVACY_LABELS[privacy].toUpperCase()}
      </Text>
      <Text style={[styles.body, { color: colors.ink }]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 6, marginTop: 6 },
  label: { fontFamily: fonts.mono, fontSize: 12 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23 },
});

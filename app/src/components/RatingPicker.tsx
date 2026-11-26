import { Link } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts, offsetShadow, useColors } from '../theme';

type Props = {
  /** Nota guardada (1 a 5) o null. */
  value: number | null;
  /** «este álbum», «este EP», «esta canción»… para el texto de ayuda. */
  itemLabel: string;
  signedIn: boolean;
  saving: boolean;
  error: string | null;
  onRate: (rating: number) => void;
  /** Lo que va debajo de las estrellas en la misma tarjeta (la reseña, HU-23). */
  children?: ReactNode;
};

/**
 * HU-05 · «TU VALORACIÓN»: cinco estrellas que se guardan al pulsar (diseño de la ficha).
 * Un visitante también las ve, pero al pulsar se le pide entrar o crear una cuenta (PA-05-04).
 */
export function RatingPicker({
  value,
  itemLabel,
  signedIn,
  saving,
  error,
  onRate,
  children,
}: Props) {
  const colors = useColors();
  const [preview, setPreview] = useState<number | null>(null);
  const [askedToLogIn, setAskedToLogIn] = useState(false);
  const shown = preview ?? value ?? 0;

  function press(rating: number) {
    if (!signedIn) {
      setAskedToLogIn(true);
      return;
    }
    onRate(rating);
  }

  return (
    <View
      style={[
        styles.card,
        { borderColor: colors.ink, backgroundColor: colors.surface },
        offsetShadow(colors, 6),
      ]}
    >
      <View style={styles.row}>
        <Text accessibilityRole="header" style={[styles.heading, { color: colors.ink }]}>
          TU VALORACIÓN
        </Text>
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel={`Valora ${itemLabel} de 1 a 5`}
          style={styles.stars}
          onPointerLeave={() => setPreview(null)}
        >
          {[1, 2, 3, 4, 5].map((rating) => (
            <Pressable
              key={rating}
              accessibilityRole="radio"
              accessibilityLabel={`${rating} ${rating === 1 ? 'estrella' : 'estrellas'}`}
              accessibilityState={{ checked: value === rating, disabled: saving }}
              aria-checked={value === rating}
              aria-disabled={saving}
              disabled={saving}
              onPress={() => press(rating)}
              onHoverIn={() => setPreview(rating)}
              onHoverOut={() => setPreview(null)}
              hitSlop={4}
            >
              <Text
                style={[styles.star, { color: rating <= shown ? colors.ink : colors.starEmpty }]}
              >
                ★
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={[styles.hint, { color: colors.ink }]}>
          {saving ? 'GUARDANDO…' : 'SE GUARDA AL PULSAR · PUEDES CAMBIARLA CUANDO QUIERAS'}
        </Text>
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={[styles.message, { color: colors.accentText }]}>
          {error}
        </Text>
      ) : null}
      {askedToLogIn ? (
        <Text accessibilityRole="alert" style={[styles.message, { color: colors.ink }]}>
          Para valorar,{' '}
          <Link href="/acceso" style={[styles.link, { color: colors.accentText }]}>
            inicia sesión
          </Link>{' '}
          o{' '}
          <Link href="/registro" style={[styles.link, { color: colors.accentText }]}>
            crea una cuenta
          </Link>
          .
        </Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 2, padding: 22, gap: 10, marginTop: 8, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  heading: { fontFamily: fonts.monoMedium, fontSize: 13 },
  stars: { flexDirection: 'row', gap: 4 },
  star: { fontSize: 30, lineHeight: 32 },
  hint: { fontFamily: fonts.mono, fontSize: 11 },
  message: { fontFamily: fonts.body, fontSize: 14 },
  link: { fontFamily: fonts.bodyBold, textDecorationLine: 'underline' },
});

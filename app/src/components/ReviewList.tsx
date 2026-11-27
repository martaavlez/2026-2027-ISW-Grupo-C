import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatCount, relativeTime, stars } from '../features/catalog/format';
import type { Review } from '../services/api';
import { fonts, useColors } from '../theme';

// Colores pastel de los avatares del diseño; el texto va siempre oscuro para que se lea.
const AVATAR_COLORS = ['#CFC4F0', '#C9D8BE', '#F2E3A8', '#F9D7E6', '#BFDDE6'];
const AVATAR_TEXT = '#161412';

function avatarColor(username: string): string {
  let hash = 0;
  for (const char of username) hash = (hash * 31 + char.charCodeAt(0)) % 997;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

type Props = {
  reviews: Review[];
  total: number;
  loadingMore: boolean;
  loadMoreError: string | null;
  onLoadMore: () => void;
  now?: Date;
};

/**
 * Reseñas que puede ver quien mira (RN-08), de la más reciente a la más antigua.
 * El texto de cada reseña se pinta como texto, nunca como HTML.
 */
export function ReviewList({ reviews, total, loadingMore, loadMoreError, onLoadMore, now }: Props) {
  const colors = useColors();
  const ink = { color: colors.ink };

  return (
    <View>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.heading, ink]}>
          RESEÑAS
        </Text>
        <Text style={[styles.mono, ink]}>LAS QUE PUEDES VER · {formatCount(total)}</Text>
      </View>
      {reviews.length === 0 ? (
        <Text style={[styles.empty, { color: colors.ink, borderTopColor: colors.ink }]}>
          Todavía no hay reseñas que puedas ver.
        </Text>
      ) : null}
      {reviews.map((review) => (
        <View key={review.id} style={[styles.review, { borderTopColor: colors.ink }]}>
          <View
            style={[
              styles.avatar,
              { borderColor: colors.ink, backgroundColor: avatarColor(review.username) },
            ]}
          >
            <Text style={[styles.initial, { color: AVATAR_TEXT }]}>
              {review.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.content}>
            <View style={styles.meta}>
              {/* HU-24 · Desde una reseña se llega al perfil de quien la escribió. */}
              <Link
                href={`/usuario/${encodeURIComponent(review.username)}`}
                style={StyleSheet.flatten([styles.username, ink])}
              >
                @{review.username}
              </Link>
              <Text
                style={[styles.stars, ink]}
                accessibilityLabel={`${review.rating} de 5 estrellas`}
              >
                {stars(review.rating)}
              </Text>
              <Text style={[styles.mono, ink]}>{relativeTime(review.createdAt, now)}</Text>
            </View>
            {review.body ? (
              <Text style={[styles.body, ink]}>{review.body}</Text>
            ) : (
              <Text style={[styles.mono, styles.quick, ink]}>VALORACIÓN RÁPIDA, SIN TEXTO</Text>
            )}
          </View>
        </View>
      ))}
      {loadMoreError ? (
        <Text style={[styles.mono, styles.error, { color: colors.accentText }]}>
          {loadMoreError}
        </Text>
      ) : null}
      {reviews.length < total ? (
        <Pressable
          accessibilityRole="button"
          onPress={onLoadMore}
          disabled={loadingMore}
          style={styles.more}
        >
          <Text style={[styles.mono, styles.moreText, ink]}>
            {loadingMore ? 'CARGANDO…' : 'VER MÁS RESEÑAS →'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  heading: { fontFamily: fonts.display, fontSize: 40, lineHeight: 40 },
  mono: { fontFamily: fonts.mono, fontSize: 12 },
  empty: { fontFamily: fonts.body, fontSize: 15, paddingVertical: 16, borderTopWidth: 1 },
  review: { flexDirection: 'row', gap: 14, paddingVertical: 16, borderTopWidth: 1 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { fontFamily: fonts.bodyExtraBold, fontSize: 16 },
  content: { flex: 1 },
  meta: { flexDirection: 'row', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' },
  username: { fontFamily: fonts.bodyExtraBold, fontSize: 15 },
  stars: { fontSize: 15, letterSpacing: 2 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23, marginTop: 6 },
  quick: { marginTop: 6 },
  error: { marginTop: 10 },
  more: { alignSelf: 'flex-start', marginTop: 10 },
  moreText: { textDecorationLine: 'underline' },
});

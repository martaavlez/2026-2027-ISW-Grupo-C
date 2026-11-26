import { Link } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { albumTypeLabel, relativeTime, stars } from '../features/catalog/format';
import { useMore } from '../features/profile/useMore';
import { getMyReviews, type Page, type ProfileReview } from '../services/api';
import { fonts, useColors } from '../theme';
import { MoreButton } from './MoreButton';
import { PRIVACY_LABELS } from './ReviewComposer';

/**
 * Carpeta Reseñas del perfil: tus reseñas y valoraciones, con su privacidad. Salen las
 * más recientes y «Ver más reseñas» trae las siguientes.
 */
export function ProfileReviews({
  reviews: first,
  token,
  onExpired,
  now,
}: {
  reviews: Page<ProfileReview>;
  token: string;
  onExpired: () => void;
  now?: Date;
}) {
  const colors = useColors();
  const ink = { color: colors.ink };
  const loadFrom = useCallback((offset: number) => getMyReviews(token, offset), [token]);
  const { items: reviews, ...more } = useMore(first, loadFrom, onExpired);
  if (reviews.length === 0) {
    return (
      <Text style={[styles.empty, ink]}>
        Todavía no has valorado ni reseñado nada. Busca un disco con la lupa y dale tus estrellas.
      </Text>
    );
  }
  return (
    <View>
      {reviews.map((review, index) => (
        <View
          key={review.id}
          style={[
            styles.review,
            index > 0 ? { borderTopWidth: 1, borderTopColor: colors.ink } : null,
          ]}
        >
          <View style={styles.meta}>
            <Link
              href={
                review.kind === 'album' ? `/album/${review.itemId}` : `/cancion/${review.itemId}`
              }
              style={[styles.title, ink]}
            >
              {review.itemTitle}
            </Link>
            <Text style={[styles.mono, ink]}>
              {(review.kind === 'song'
                ? 'CANCIÓN'
                : albumTypeLabel(review.albumType ?? 'album')
              ).toUpperCase()}
            </Text>
          </View>
          <View style={styles.meta}>
            <Text
              style={[styles.stars, ink]}
              accessibilityLabel={`${review.rating} de 5 estrellas`}
            >
              {stars(review.rating)}
            </Text>
            <Text style={[styles.mono, ink]}>
              {PRIVACY_LABELS[review.privacy].toUpperCase()} · {relativeTime(review.createdAt, now)}
            </Text>
          </View>
          {review.body ? (
            <Text style={[styles.body, ink]}>{review.body}</Text>
          ) : (
            <Text style={[styles.mono, ink]}>VALORACIÓN RÁPIDA, SIN TEXTO</Text>
          )}
        </View>
      ))}
      <MoreButton
        label="VER MÁS RESEÑAS"
        remaining={more.remaining}
        loading={more.loading}
        error={more.error}
        onPress={more.loadMore}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { fontFamily: fonts.body, fontSize: 16 },
  review: { paddingVertical: 14, gap: 6 },
  meta: { flexDirection: 'row', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' },
  title: { fontFamily: fonts.bodyExtraBold, fontSize: 16 },
  mono: { fontFamily: fonts.mono, fontSize: 11 },
  stars: { fontSize: 15, letterSpacing: 2 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23 },
});

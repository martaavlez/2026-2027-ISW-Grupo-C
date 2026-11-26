// HU-04 · Ficha de un álbum (PA-04-01): información, valoración media, canciones y reseñas visibles.
// Valorar, reseñar, favoritos, tableros y el ranking personal se añaden con sus propias HU.
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ArtistLinks } from '../../components/ArtistLinks';
import { CdCase } from '../../components/CdCase';
import { FavoriteButton } from '../../components/FavoriteButton';
import { MyReview } from '../../components/MyReview';
import { RatingPicker } from '../../components/RatingPicker';
import { ReviewComposer } from '../../components/ReviewComposer';
import { InfoList } from '../../components/InfoList';
import { ItemPage, ItemStatus, titleSize, useIsDesktop } from '../../components/ItemPage';
import { RatingSummary } from '../../components/RatingSummary';
import { ReviewList } from '../../components/ReviewList';
import { TrackList } from '../../components/TrackList';
import {
  albumTypeLabel,
  thisAlbumLabel,
  formatTotalDuration,
  headline,
} from '../../features/catalog/format';
import { useCatalogItem } from '../../features/catalog/useCatalogItem';
import { useRating } from '../../features/catalog/useRating';
import { useReview } from '../../features/catalog/useReview';
import { getAlbum } from '../../services/api';
import { fonts, useColors } from '../../theme';

export default function AlbumScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const desktop = useIsDesktop();
  const { state, retry, loadMore, loadingMore, loadMoreError, updateItem, addReview, signedIn } =
    useCatalogItem('album', String(id), getAlbum);

  const rating = useRating(
    'album',
    String(id),
    state.status === 'ready' ? state.item.myRating : null,
    updateItem,
  );

  const review = useReview('album', String(id), rating.value, updateItem, addReview);

  if (state.status === 'loading') return <ItemStatus loading />;
  if (state.status === 'error') {
    return <ItemStatus message={state.error} onRetry={state.notFound ? undefined : retry} />;
  }

  const album = state.item;
  const size = titleSize(album.title, desktop);
  const songsLabel = album.songs.length
    ? `${album.songs.length} · ${formatTotalDuration(album.totalDurationSeconds)}`
    : null;

  return (
    <ItemPage
      header={
        <>
          <Text style={[styles.kicker, { color: colors.ink }]}>
            {headline([albumTypeLabel(album.type), album.releaseYear, album.genre])}
          </Text>
          <Text
            accessibilityRole="header"
            style={[styles.title, { color: colors.ink, fontSize: size, lineHeight: size * 0.86 }]}
          >
            {album.title.toUpperCase()}
          </Text>
          <View style={styles.artists}>
            <ArtistLinks artists={album.artists} />
          </View>
          <RatingPicker
            value={rating.value}
            itemLabel={thisAlbumLabel(album.type)}
            signedIn={signedIn}
            saving={rating.saving}
            error={rating.error}
            onRate={rating.rate}
          >
            {signedIn && album.myReview ? (
              <MyReview body={album.myReview.body} privacy={album.myReview.privacy} />
            ) : null}
            {signedIn && !album.myReview ? (
              <ReviewComposer
                placeholder="¿Qué te ha parecido el disco?"
                defaultPrivacy={album.defaultPrivacy ?? 'public'}
                publishing={review.publishing}
                errors={review.errors}
                onPublish={review.publish}
                onEdit={review.clearErrors}
              />
            ) : null}
          </RatingPicker>
        </>
      }
      aside={
        <>
          <CdCase coverUrl={album.coverUrl} size={desktop ? 420 : 300} />
          <FavoriteButton
            key={album.id}
            kind="album"
            id={album.id}
            initial={Boolean(album.isFavorite)}
          />
          <RatingSummary
            averageRating={album.averageRating}
            ratingsCount={album.ratingsCount}
            distribution={album.distribution}
          />
          <InfoList
            items={[
              ['Tipo', albumTypeLabel(album.type)],
              ['Año', album.releaseYear ? String(album.releaseYear) : null],
              ['Género', album.genre],
              ['Canciones', songsLabel],
            ]}
          />
        </>
      }
    >
      {album.songs.length ? <TrackList songs={album.songs} /> : null}
      <ReviewList
        reviews={state.reviews}
        total={state.total}
        loadingMore={loadingMore}
        loadMoreError={loadMoreError}
        onLoadMore={loadMore}
      />
    </ItemPage>
  );
}

const styles = StyleSheet.create({
  kicker: { fontFamily: fonts.mono, fontSize: 13 },
  title: { fontFamily: fonts.display },
  artists: { marginBottom: 12 },
});

// HU-04 · Ficha de una canción (PA-04-01): como la del álbum, pero sin canciones ni ranking personal.
import { Link, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

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
import { albumTypeLabel, formatDuration, headline } from '../../features/catalog/format';
import { useCatalogItem } from '../../features/catalog/useCatalogItem';
import { useRating } from '../../features/catalog/useRating';
import { useReview } from '../../features/catalog/useReview';
import { getSong } from '../../services/api';
import { fonts, useColors } from '../../theme';

export default function SongScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const desktop = useIsDesktop();
  const ficha = useCatalogItem('song', String(id), getSong);
  const { state, retry, loadMore, loadingMore, loadMoreError, updateItem, signedIn } = ficha;

  const rating = useRating(
    'song',
    String(id),
    state.status === 'ready' ? state.item.myRating : null,
    updateItem,
  );

  const review = useReview('song', String(id), rating.value, ficha);

  if (state.status === 'loading') return <ItemStatus loading />;
  if (state.status === 'error') {
    return <ItemStatus message={state.error} onRetry={state.notFound ? undefined : retry} />;
  }

  const song = state.item;
  const size = titleSize(song.title, desktop);

  return (
    <ItemPage
      header={
        <>
          <Text style={[styles.kicker, { color: colors.ink }]}>
            {headline(['Canción', song.album.releaseYear, song.genre])}
          </Text>
          <Text
            accessibilityRole="header"
            style={[styles.title, { color: colors.ink, fontSize: size, lineHeight: size * 0.86 }]}
          >
            {song.title.toUpperCase()}
          </Text>
          <ArtistLinks artists={song.artists} />
          <Link
            href={`/album/${song.album.id}`}
            style={[
              styles.mono,
              styles.albumLink,
              { color: colors.ink, borderBottomColor: colors.ink },
            ]}
          >
            DEL {albumTypeLabel(song.album.type).toUpperCase()} {song.album.title.toUpperCase()} →
          </Link>
          <RatingPicker
            value={rating.value}
            itemLabel={'esta canción'}
            signedIn={signedIn}
            saving={rating.saving}
            error={rating.error}
            onRate={rating.rate}
          >
            {signedIn && song.myReview ? (
              <MyReview
                body={song.myReview.body}
                privacy={song.myReview.privacy}
                placeholder="¿Qué te ha parecido la canción?"
                saving={review.publishing}
                errors={review.errors}
                removing={review.removing}
                removeError={review.removeError}
                onSave={review.save}
                onRemove={review.remove}
                onClearErrors={review.clearErrors}
              />
            ) : null}
            {signedIn && !song.myReview ? (
              <ReviewComposer
                placeholder="¿Qué te ha parecido la canción?"
                defaultPrivacy={song.defaultPrivacy ?? 'public'}
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
          <CdCase coverUrl={song.album.coverUrl} size={desktop ? 420 : 300} />
          <FavoriteButton
            key={song.id}
            kind="song"
            id={song.id}
            initial={Boolean(song.isFavorite)}
          />
          <RatingSummary
            averageRating={song.averageRating}
            ratingsCount={song.ratingsCount}
            distribution={song.distribution}
          />
          <InfoList
            items={[
              [albumTypeLabel(song.album.type), song.album.title],
              ['Pista', song.trackNumber ? String(song.trackNumber) : null],
              ['Duración', formatDuration(song.durationSeconds)],
              ['Año', song.album.releaseYear ? String(song.album.releaseYear) : null],
              ['Género', song.genre],
            ]}
          />
        </>
      }
    >
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
  mono: { fontFamily: fonts.mono, fontSize: 14 },
  albumLink: { alignSelf: 'flex-start', borderBottomWidth: 1.5, marginBottom: 12 },
});

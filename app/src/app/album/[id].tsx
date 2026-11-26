// HU-04 · Ficha de un álbum (PA-04-01): información, valoración media, canciones y reseñas visibles.
// Valorar, reseñar, favoritos, tableros y el ranking personal se añaden con sus propias HU.
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ArtistLinks } from '../../components/ArtistLinks';
import { CdCase } from '../../components/CdCase';
import { InfoList } from '../../components/InfoList';
import { ItemPage, ItemStatus, titleSize, useIsDesktop } from '../../components/ItemPage';
import { RatingSummary } from '../../components/RatingSummary';
import { ReviewList } from '../../components/ReviewList';
import { TrackList } from '../../components/TrackList';
import { albumTypeLabel, formatTotalDuration, headline } from '../../features/catalog/format';
import { useCatalogItem } from '../../features/catalog/useCatalogItem';
import { getAlbum } from '../../services/api';
import { fonts, useColors } from '../../theme';

export default function AlbumScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const desktop = useIsDesktop();
  const { state, retry, loadMore, loadingMore, loadMoreError } = useCatalogItem(
    'album',
    String(id),
    getAlbum,
  );

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
        </>
      }
      aside={
        <>
          <CdCase coverUrl={album.coverUrl} size={desktop ? 420 : 300} />
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

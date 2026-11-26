// HU-59 · Ficha de un artista (PA-59-01): su información y sus álbumes.
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Discography } from '../../components/AlbumGrid';
import { ArtistPhoto } from '../../components/ArtistPhoto';
import { InfoList } from '../../components/InfoList';
import { ItemPage, ItemStatus, titleSize, useIsDesktop } from '../../components/ItemPage';
import { albumTypePlural, formatCount, groupByType, headline } from '../../features/catalog/format';
import { useArtist } from '../../features/catalog/useArtist';
import { fonts, useColors } from '../../theme';

export default function ArtistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const desktop = useIsDesktop();
  const { state, retry } = useArtist(String(id));

  if (state.status === 'loading') return <ItemStatus loading />;
  if (state.status === 'error') {
    return <ItemStatus message={state.error} onRetry={state.notFound ? undefined : retry} />;
  }

  const { artist } = state;
  const size = titleSize(artist.name, desktop);

  return (
    <ItemPage
      header={
        <>
          <Text style={[styles.kicker, { color: colors.ink }]}>
            {headline(['Artista', artist.genre])}
          </Text>
          <Text
            accessibilityRole="header"
            style={[styles.title, { color: colors.ink, fontSize: size, lineHeight: size * 0.86 }]}
          >
            {artist.name.toUpperCase()}
          </Text>
        </>
      }
      aside={
        <>
          <View style={styles.photo}>
            <ArtistPhoto name={artist.name} imageUrl={artist.imageUrl} size={desktop ? 360 : 240} />
            {artist.imageUrl && artist.imageCredit ? (
              <Text style={[styles.credit, { color: colors.ink }]}>FOTO: {artist.imageCredit}</Text>
            ) : null}
          </View>
          <InfoList
            items={[
              ['Género', artist.genre],
              ...groupByType(artist.albums).map(({ type, items }): [string, string | null] => [
                albumTypePlural(type),
                items.length ? formatCount(items.length) : null,
              ]),
              ['Canciones', formatCount(artist.songsCount)],
            ]}
          />
        </>
      }
    >
      {artist.description ? (
        <Text style={[styles.description, { color: colors.ink }]}>{artist.description}</Text>
      ) : null}
      <Discography albums={artist.albums} />
    </ItemPage>
  );
}

const styles = StyleSheet.create({
  kicker: { fontFamily: fonts.mono, fontSize: 13 },
  title: { fontFamily: fonts.display },
  photo: { gap: 12 },
  credit: { fontFamily: fonts.mono, fontSize: 10, maxWidth: 360 },
  description: { fontFamily: fonts.body, fontSize: 17, lineHeight: 27, maxWidth: 720 },
});

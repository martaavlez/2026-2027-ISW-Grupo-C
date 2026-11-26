import { Link } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { albumTypePlural, formatRating, groupByType, headline } from '../features/catalog/format';
import type { ArtistAlbum } from '../services/api';
import { fonts, useColors } from '../theme';
import { useIsDesktop } from './ItemPage';

function Cover({ album, size }: { album: ArtistAlbum; size: number }) {
  const colors = useColors();
  const [failed, setFailed] = useState(false);
  return (
    <View
      aria-hidden
      style={[
        styles.cover,
        {
          width: size,
          height: size,
          borderColor: colors.ink,
          backgroundColor: colors.kraft,
          boxShadow: `4px 4px 0 ${colors.shadow}`,
        },
      ]}
    >
      {album.coverUrl && !failed ? (
        <Image
          source={{ uri: album.coverUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <Text style={[styles.coverInitial, { color: colors.ink }]}>
          {album.title.charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

/** Una sección de la discografía (Álbumes, EPs o Singles). Cada disco abre su ficha. */
function AlbumSection({ title, albums }: { title: string; albums: ArtistAlbum[] }) {
  const colors = useColors();
  const ink = { color: colors.ink };
  // En móvil caben dos por fila.
  const cardWidth = useIsDesktop() ? 180 : 148;
  return (
    <View>
      <Text accessibilityRole="header" style={[styles.heading, { color: colors.accentText }]}>
        {title.toUpperCase()} · {albums.length}
      </Text>
      <View style={styles.grid}>
        {albums.map((album) => (
          <View key={album.id} style={[styles.card, { width: cardWidth }]}>
            <Cover album={album} size={cardWidth} />
            <Link href={`/album/${album.id}`} style={[styles.title, ink]}>
              {album.title}
            </Link>
            <Text style={[styles.mono, ink]}>
              {headline([album.releaseYear])}
              {album.averageRating === null
                ? ''
                : `${album.releaseYear ? ' · ' : ''}★ ${formatRating(album.averageRating)}`}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Discografía del artista separada en Álbumes, EPs y Singles (RI-07 · Tipo), cada grupo del
 * más reciente al más antiguo. Los grupos vacíos no salen.
 */
export function Discography({ albums }: { albums: ArtistAlbum[] }) {
  const colors = useColors();
  if (albums.length === 0) {
    return (
      <Text style={[styles.empty, { color: colors.ink }]}>
        Todavía no hay discos de este artista en el catálogo.
      </Text>
    );
  }
  return (
    <View style={styles.sections}>
      {groupByType(albums)
        .filter((group) => group.items.length > 0)
        .map((group) => (
          <AlbumSection key={group.type} title={albumTypePlural(group.type)} albums={group.items} />
        ))}
    </View>
  );
}
const styles = StyleSheet.create({
  sections: { gap: 36 },
  heading: { fontFamily: fonts.monoMedium, fontSize: 13, marginBottom: 14 },
  empty: { fontFamily: fonts.body, fontSize: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 28, rowGap: 24 },
  card: { gap: 8 },
  cover: {
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverInitial: { fontFamily: fonts.display, fontSize: 72 },
  title: { fontFamily: fonts.bodyBold, fontSize: 15 },
  mono: { fontFamily: fonts.mono, fontSize: 11 },
});

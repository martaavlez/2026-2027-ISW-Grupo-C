import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import type { ArtistRef } from '../services/api';
import { fonts, useColors } from '../theme';

/** Artistas de una canción o un álbum; cada uno abre su ficha (HU-59). */
export function ArtistLinks({ artists }: { artists: ArtistRef[] }) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      {artists.map((artist) => (
        <Link
          key={artist.id}
          href={`/artista/${artist.id}`}
          style={[styles.link, { color: colors.ink, borderBottomColor: colors.ink }]}
        >
          {artist.name.toUpperCase()} →
        </Link>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  link: { fontFamily: fonts.mono, fontSize: 14, borderBottomWidth: 1.5 },
});

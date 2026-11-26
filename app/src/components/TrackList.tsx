import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { formatDuration, formatRating } from '../features/catalog/format';
import type { AlbumSong } from '../services/api';
import { fonts, useColors } from '../theme';

/** Canciones del álbum con su nota media y duración. Cada título abre su ficha. */
export function TrackList({ songs }: { songs: AlbumSong[] }) {
  const colors = useColors();
  return (
    <View>
      <Text accessibilityRole="header" style={[styles.heading, { color: colors.accentText }]}>
        CANCIONES
      </Text>
      <View style={[styles.list, { borderBottomColor: colors.ink }]}>
        {songs.map((song, index) => (
          <View key={song.id} style={[styles.row, { borderTopColor: colors.ink }]}>
            <Text style={[styles.mono, styles.number, { color: colors.ink }]}>
              {String(song.trackNumber ?? index + 1).padStart(2, '0')}
            </Text>
            <Link href={`/cancion/${song.id}`} style={[styles.title, { color: colors.ink }]}>
              {song.title}
            </Link>
            <Text style={[styles.mono, styles.side, { color: colors.ink }]}>
              {song.averageRating === null ? '' : `★ ${formatRating(song.averageRating)}`}
            </Text>
            <Text style={[styles.mono, styles.side, { color: colors.ink }]}>
              {formatDuration(song.durationSeconds)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { fontFamily: fonts.monoMedium, fontSize: 13, marginBottom: 10 },
  list: { borderBottomWidth: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
    borderTopWidth: 1,
  },
  mono: { fontFamily: fonts.mono, fontSize: 12 },
  number: { width: 32 },
  title: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 15 },
  side: { width: 54, textAlign: 'right' },
});

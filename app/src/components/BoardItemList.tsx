import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { albumTypeLabel, relativeTime, stars } from '../features/catalog/format';
import type { BoardItem } from '../services/boards-api';
import { fonts, useColors } from '../theme';
import { useIsDesktop } from './ItemPage';
import { Thumb } from './SearchResultList';

const ratingText = (item: BoardItem) =>
  item.myRating ? `TU NOTA ${stars(item.myRating)}` : 'TU NOTA —';
const ratingLabel = (item: BoardItem) =>
  item.myRating ? `Tu nota: ${item.myRating} de 5` : 'Sin tu nota';

const itemHref = (item: BoardItem) =>
  item.kind === 'song' ? `/cancion/${item.catalogId}` : `/album/${item.catalogId}`;

/**
 * Contenido del tablero (diseño HertzTablero): número, tipo, título, artistas, tu nota y
 * cuándo se añadió. Con `onRemove`, el dueño quita cada elemento (HU-49).
 */
export function BoardItemList({
  items,
  emptyText,
  onRemove,
  removing = false,
}: {
  items: BoardItem[];
  emptyText: string;
  onRemove?: (item: BoardItem) => void;
  removing?: boolean;
}) {
  const colors = useColors();
  const desktop = useIsDesktop();
  const ink = { color: colors.ink };
  if (items.length === 0) return <Text style={[styles.empty, ink]}>{emptyText}</Text>;
  return (
    <View style={[styles.list, { borderBottomColor: colors.ink }]}>
      {items.map((item, index) => {
        const type =
          item.kind === 'song'
            ? 'CANCIÓN'
            : albumTypeLabel(item.albumType ?? 'album').toUpperCase();
        return (
          <View key={item.id} style={[styles.row, { borderTopColor: colors.ink }]}>
            <Text style={[styles.number, ink]}>{String(index + 1).padStart(2, '0')}</Text>
            <Thumb url={item.coverUrl} label={item.title} />
            <View style={styles.text}>
              <Text style={[styles.mono, ink]}>{type}</Text>
              <Link href={itemHref(item)} style={[styles.title, ink]}>
                {item.title}
              </Link>
              <Text style={[styles.detail, ink]}>
                {item.artists.map((artist) => artist.name).join(', ')}
              </Text>
              {desktop ? null : (
                <Text style={[styles.mono, ink]} accessibilityLabel={ratingLabel(item)}>
                  {ratingText(item)} · {relativeTime(item.addedAt).toUpperCase()}
                </Text>
              )}
            </View>
            {desktop ? (
              <View style={styles.meta}>
                <Text style={[styles.mono, ink]} accessibilityLabel={ratingLabel(item)}>
                  {ratingText(item)}
                </Text>
                <Text style={[styles.mono, ink]}>{relativeTime(item.addedAt).toUpperCase()}</Text>
              </View>
            ) : null}
            {onRemove ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Quitar ${item.title} del tablero`}
                disabled={removing}
                hitSlop={8}
                onPress={() => onRemove(item)}
                style={[styles.remove, { borderColor: colors.ink }]}
              >
                <Text style={[styles.removeText, ink]}>×</Text>
              </Pressable>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { borderBottomWidth: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    borderTopWidth: 2,
  },
  number: { fontFamily: fonts.mono, fontSize: 14, width: 26 },
  text: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontFamily: fonts.bodyBold, fontSize: 16 },
  detail: { fontFamily: fonts.body, fontSize: 14 },
  meta: { alignItems: 'flex-end', gap: 4 },
  mono: { fontFamily: fonts.mono, fontSize: 11 },
  remove: { width: 32, height: 32, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  removeText: { fontFamily: fonts.bodyBold, fontSize: 18, lineHeight: 20 },
  empty: { fontFamily: fonts.body, fontSize: 16 },
});

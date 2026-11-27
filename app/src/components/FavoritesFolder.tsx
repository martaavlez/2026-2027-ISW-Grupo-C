import { useCallback, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useMore } from '../features/profile/useMore';
import type { FavoriteItem, FavoriteType, Favorites, Page, PageResult } from '../services/api';
import { fonts, useColors } from '../theme';
import { MoreButton } from './MoreButton';
import { AlbumRow, ArtistRow, Section, SongRow } from './SearchResultList';

function FavoriteSection<T extends { id: string }>({
  title,
  moreLabel,
  first,
  loadFrom,
  onExpired,
  renderItem,
}: {
  title: string;
  moreLabel: string;
  first: Page<T>;
  loadFrom: (offset: number) => Promise<PageResult<T>>;
  onExpired: () => void;
  renderItem: (item: T) => ReactNode;
}) {
  const more = useMore(first, loadFrom, onExpired);
  return (
    <Section
      title={title}
      count={first.total}
      footer={
        <MoreButton
          label={moreLabel}
          remaining={more.remaining}
          loading={more.loading}
          error={more.error}
          onPress={more.loadMore}
        />
      }
    >
      {more.items.map(renderItem)}
    </Section>
  );
}

/**
 * Carpeta Favoritos del perfil: canciones, álbumes y artistas por separado. De cada uno
 * salen los primeros, y «Ver más» trae los siguientes para no cargar 200 de golpe.
 */
type LoadFavorites = <K extends FavoriteType>(
  type: K,
  offset: number,
) => Promise<PageResult<FavoriteItem[K]>>;

export function FavoritesFolder({
  favorites,
  loadFrom,
  onExpired,
  emptyText = 'Todavía no tienes favoritos. Márcalos con «♡ Favorito» en la ficha de una canción, un álbum o un artista.',
}: {
  favorites: Favorites;
  /** «Ver más» de una subcategoría (tus favoritos o los de otro usuario). */
  loadFrom: LoadFavorites;
  onExpired: () => void;
  emptyText?: string;
}) {
  const colors = useColors();
  const { songs, albums, artists } = favorites;
  const moreSongs = useCallback((offset: number) => loadFrom('songs', offset), [loadFrom]);
  const moreAlbums = useCallback((offset: number) => loadFrom('albums', offset), [loadFrom]);
  const moreArtists = useCallback((offset: number) => loadFrom('artists', offset), [loadFrom]);

  if (songs.total + albums.total + artists.total === 0) {
    return <Text style={[styles.empty, { color: colors.ink }]}>{emptyText}</Text>;
  }
  return (
    <View style={styles.sections}>
      <FavoriteSection
        title="CANCIONES"
        moreLabel="VER MÁS CANCIONES"
        first={songs}
        loadFrom={moreSongs}
        onExpired={onExpired}
        renderItem={(song) => <SongRow key={song.id} song={song} />}
      />
      <FavoriteSection
        title="ÁLBUMES, EPS Y SINGLES"
        moreLabel="VER MÁS DISCOS"
        first={albums}
        loadFrom={moreAlbums}
        onExpired={onExpired}
        renderItem={(album) => <AlbumRow key={album.id} album={album} />}
      />
      <FavoriteSection
        title="ARTISTAS"
        moreLabel="VER MÁS ARTISTAS"
        first={artists}
        loadFrom={moreArtists}
        onExpired={onExpired}
        renderItem={(artist) => <ArtistRow key={artist.id} artist={artist} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sections: { gap: 36 },
  empty: { fontFamily: fonts.body, fontSize: 16 },
});

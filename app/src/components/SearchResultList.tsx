import { Link } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { albumTypeLabel, formatCount, headline } from '../features/catalog/format';
import type { SearchResults } from '../services/api';
import { fonts, useColors } from '../theme';

/** Miniatura cuadrada (portada) o redonda (artista, usuario). Sin imagen, la inicial. */
export function Thumb({
  url,
  label,
  round,
}: {
  url: string | null;
  label: string;
  round?: boolean;
}) {
  const colors = useColors();
  const [failed, setFailed] = useState(false);
  return (
    <View
      aria-hidden
      style={[
        styles.thumb,
        {
          borderColor: colors.ink,
          backgroundColor: round ? colors.folderOpen : colors.kraft,
          borderRadius: round ? 24 : 0,
        },
      ]}
    >
      {url && !failed ? (
        <Image
          source={{ uri: url }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <Text style={[styles.thumbText, { color: colors.ink }]}>
          {label.charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

/** Una fila de resultado; `actions` son botones a la derecha (aceptar una solicitud…). */
export function Row({
  thumb,
  title,
  href,
  detail,
  actions,
}: {
  thumb: ReactNode;
  title: string;
  href?: string;
  detail: string;
  actions?: ReactNode;
}) {
  const colors = useColors();
  const titleStyle = [styles.title, { color: colors.ink }];
  return (
    <View style={[styles.row, { borderTopColor: colors.ink }]}>
      {thumb}
      <View style={styles.text}>
        {href ? (
          <Link href={href} style={titleStyle}>
            {title}
          </Link>
        ) : (
          <Text style={titleStyle}>{title}</Text>
        )}
        {detail ? <Text style={[styles.detail, { color: colors.ink }]}>{detail}</Text> : null}
      </View>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
}

/** Una categoría con su nombre y cuántos hay; `footer` va debajo de la lista («Ver más»). */
export function Section({
  title,
  count,
  children,
  footer,
}: {
  title: string;
  count: number;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const colors = useColors();
  if (count === 0) return null;
  return (
    <View>
      <Text accessibilityRole="header" style={[styles.heading, { color: colors.accentText }]}>
        {title} · {formatCount(count)}
      </Text>
      <View style={[styles.list, { borderBottomColor: colors.ink }]}>{children}</View>
      {footer}
    </View>
  );
}

const names = (artists: { name: string }[]) => artists.map((artist) => artist.name).join(', ');

export function SongRow({ song }: { song: SearchResults['songs'][number] }) {
  return (
    <Row
      thumb={<Thumb url={song.coverUrl} label={song.title} />}
      title={song.title}
      href={`/cancion/${song.id}`}
      detail={headline([names(song.artists), song.albumTitle])}
    />
  );
}

export function AlbumRow({ album }: { album: SearchResults['albums'][number] }) {
  return (
    <Row
      thumb={<Thumb url={album.coverUrl} label={album.title} />}
      title={album.title}
      href={`/album/${album.id}`}
      detail={headline([albumTypeLabel(album.type), album.releaseYear, names(album.artists)])}
    />
  );
}

export function ArtistRow({ artist }: { artist: SearchResults['artists'][number] }) {
  return (
    <Row
      thumb={<Thumb url={artist.imageUrl} label={artist.name} round />}
      title={artist.name}
      href={`/artista/${artist.id}`}
      detail={headline(['Artista', artist.genre])}
    />
  );
}

/**
 * Resultados separados por categorías (PA-03-01). Las categorías sin resultados no salen.
 * Usuarios y comunidades todavía no tienen página propia: se enlazarán con sus HU.
 */
export function SearchResultList({ results }: { results: SearchResults }) {
  return (
    <View style={styles.sections}>
      <Section title="CANCIONES" count={results.songs.length}>
        {results.songs.map((song) => (
          <SongRow key={song.id} song={song} />
        ))}
      </Section>
      <Section title="ÁLBUMES, EPS Y SINGLES" count={results.albums.length}>
        {results.albums.map((album) => (
          <AlbumRow key={album.id} album={album} />
        ))}
      </Section>
      <Section title="ARTISTAS" count={results.artists.length}>
        {results.artists.map((artist) => (
          <ArtistRow key={artist.id} artist={artist} />
        ))}
      </Section>
      <Section title="USUARIOS" count={results.users.length}>
        {results.users.map((user) => (
          <Row
            key={user.username}
            thumb={<Thumb url={user.photoUrl} label={user.username} round />}
            title={`@${user.username}`}
            href={`/usuario/${encodeURIComponent(user.username)}`}
            detail={user.name}
          />
        ))}
      </Section>
      <Section title="COMUNIDADES" count={results.communities.length}>
        {results.communities.map((community) => (
          <Row
            key={community.id}
            thumb={<Thumb url={null} label={community.name} />}
            title={community.name}
            detail={headline([
              community.access === 'public' ? 'Pública' : 'Privada',
              `${formatCount(community.membersCount)} ${community.membersCount === 1 ? 'miembro' : 'miembros'}`,
            ])}
          />
        ))}
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginLeft: 'auto' },
  sections: { gap: 36 },
  heading: { fontFamily: fonts.monoMedium, fontSize: 13, marginBottom: 10 },
  list: { borderBottomWidth: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  thumb: {
    width: 48,
    height: 48,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbText: { fontFamily: fonts.display, fontSize: 24 },
  text: { flex: 1, minWidth: 0, gap: 3 },
  title: { fontFamily: fonts.bodyBold, fontSize: 16 },
  detail: { fontFamily: fonts.mono, fontSize: 11 },
});

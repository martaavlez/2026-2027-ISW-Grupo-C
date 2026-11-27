import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatCount } from '../features/catalog/format';
import type {
  FavoriteItem,
  FavoriteType,
  OwnProfile,
  PageResult,
  ProfileReview,
} from '../services/api';
import { fonts, useColors } from '../theme';
import { BoardsGrid } from './BoardsGrid';
import { FavoritesFolder } from './FavoritesFolder';
import { FolderTabs } from './FolderTabs';
import { useIsDesktop } from './ItemPage';
import { ProfileReviews } from './ProfileReviews';
import { Worm } from './Worm';

export const PROFILE_FOLDERS = ['resenas', 'favoritos', 'tableros', 'amigos'] as const;
export type ProfileFolder = (typeof PROFILE_FOLDERS)[number];

/** Lo que tienen en común tu perfil y el de otro: los favoritos pueden no ser visibles. */
export type ProfileData = Omit<OwnProfile, 'counts' | 'favorites'> & {
  counts: Omit<OwnProfile['counts'], 'favorites'> & { favorites: number | null };
  favorites: OwnProfile['favorites'] | null;
};

type Props = {
  profile: ProfileData;
  /** true en tu perfil (HU-06); false en el de otro usuario (HU-24). */
  own: boolean;
  folder: ProfileFolder;
  onFolderChange: (folder: ProfileFolder) => void;
  loadReviews: (offset: number) => Promise<PageResult<ProfileReview>>;
  loadFavorites: <K extends FavoriteType>(
    type: K,
    offset: number,
  ) => Promise<PageResult<FavoriteItem[K]>>;
  onExpired: () => void;
  /** Botones bajo los contadores (la amistad, en el perfil de otro usuario). */
  actions?: ReactNode;
  /** Solo en tu perfil: la carpeta Amigos, con solicitudes y amigos (HU-58 y HU-42). */
  friendsFolder?: ReactNode;
};

export function folderFrom(value: string | undefined): ProfileFolder {
  return PROFILE_FOLDERS.includes(value as ProfileFolder) ? (value as ProfileFolder) : 'resenas';
}

function countsLine(counts: ProfileData['counts']) {
  const plural = (value: number, one: string, many: string) =>
    `${formatCount(value)} ${value === 1 ? one : many}`;
  return [
    plural(counts.reviews, 'RESEÑA', 'RESEÑAS'),
    plural(counts.followers, 'SEGUIDOR', 'SEGUIDORES'),
    `${formatCount(counts.following)} SIGUIENDO`,
    plural(counts.friends, 'AMIGO', 'AMIGOS'),
  ].join(' · ');
}

/** El @usuario enorme del diseño, más pequeño si es largo para que no se parta. */
function usernameSize(username: string, desktop: boolean) {
  const length = username.length + 1;
  const size = desktop
    ? Math.max(56, Math.min(120, 1250 / length))
    : Math.max(30, Math.min(64, 520 / length));
  return { fontSize: Math.round(size), lineHeight: Math.round(size * 0.88) };
}

/**
 * Cabecera del perfil (diseño HertzPerfil) y sus carpetas Reseñas, Favoritos y Tableros.
 * La usan tu perfil y el de otro usuario; cambian los textos cuando algo está vacío.
 */
export function ProfileView({
  profile,
  own,
  folder,
  onFolderChange,
  loadReviews,
  loadFavorites,
  onExpired,
  actions,
  friendsFolder,
}: Props) {
  const colors = useColors();
  const desktop = useIsDesktop();
  const ink = { color: colors.ink };
  const { user, counts } = profile;
  const at = `@${user.username}`;

  return (
    <>
      <View style={[styles.header, desktop ? styles.headerRow : null]}>
        <Text
          accessibilityRole="header"
          style={[styles.username, ink, usernameSize(user.username, desktop)]}
        >
          {at.toUpperCase()}
        </Text>
        <Worm pose="cascos" width={desktop ? 130 : 96} />
        <View style={styles.about}>
          <Text style={[styles.name, ink]}>{user.name}</Text>
          {user.bio ? <Text style={[styles.bio, ink]}>{user.bio}</Text> : null}
          <Text style={[styles.mono, ink]}>{countsLine(counts)}</Text>
          {actions}
        </View>
      </View>
      <FolderTabs
        tabs={[
          {
            key: 'resenas',
            label: `RESEÑAS · ${formatCount(counts.reviews)}`,
            shortLabel: 'RESEÑAS',
          },
          {
            key: 'favoritos',
            // Si sus favoritos no son visibles para ti, tampoco se dice cuántos tiene.
            label:
              counts.favorites === null
                ? 'FAVORITOS'
                : `FAVORITOS · ${formatCount(counts.favorites)}`,
            shortLabel: 'FAVORITOS',
          },
          {
            key: 'tableros',
            label: `TABLEROS · ${formatCount(counts.boards)}`,
            shortLabel: 'TABLEROS',
          },
          ...(friendsFolder
            ? [
                {
                  key: 'amigos',
                  label: `AMIGOS · ${formatCount(counts.friends)}`,
                  shortLabel: 'AMIGOS',
                },
              ]
            : []),
        ]}
        active={folder}
        onChange={(key) => onFolderChange(key as ProfileFolder)}
      >
        {folder === 'resenas' ? (
          <ProfileReviews
            reviews={profile.reviews}
            loadFrom={loadReviews}
            onExpired={onExpired}
            emptyText={own ? undefined : `${at} no tiene reseñas que puedas ver.`}
          />
        ) : null}
        {folder === 'favoritos' && profile.favorites ? (
          <FavoritesFolder
            favorites={profile.favorites}
            loadFrom={loadFavorites}
            onExpired={onExpired}
            emptyText={own ? undefined : `${at} todavía no tiene favoritos.`}
          />
        ) : null}
        {folder === 'favoritos' && !profile.favorites ? (
          <Text style={[styles.message, ink]}>Sus favoritos no son visibles para ti.</Text>
        ) : null}
        {folder === 'amigos' ? friendsFolder : null}
        {folder === 'tableros' ? (
          <BoardsGrid
            boards={profile.boards}
            emptyText={own ? undefined : `${at} no tiene tableros que puedas ver.`}
          />
        ) : null}
      </FolderTabs>
    </>
  );
}

const styles = StyleSheet.create({
  header: { gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 24, flexWrap: 'wrap' },
  username: { fontFamily: fonts.display },
  about: { gap: 6, flexShrink: 1, minWidth: 220 },
  name: { fontFamily: fonts.bodyExtraBold, fontSize: 18 },
  bio: { fontFamily: fonts.body, fontSize: 16 },
  mono: { fontFamily: fonts.mono, fontSize: 12 },
  message: { fontFamily: fonts.body, fontSize: 16 },
});

// HU-06 · Consultar mi perfil (PA-06-01): tu información y las carpetas Reseñas,
// Favoritos (canciones, álbumes y artistas) y Tableros con todo tu contenido (diseño HertzPerfil).
// Las listas largas salen por partes, con «Ver más».
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BoardsGrid } from '../components/BoardsGrid';
import { FolderTabs } from '../components/FolderTabs';
import { useIsDesktop } from '../components/ItemPage';
import { FavoritesFolder } from '../components/FavoritesFolder';
import { ProfileReviews } from '../components/ProfileReviews';
import { TopBar } from '../components/TopBar';
import { Worm } from '../components/Worm';
import { formatCount } from '../features/catalog/format';
import { getMyProfile, type OwnProfile } from '../services/api';
import { clearSession, getSession } from '../services/session';
import { fonts, spacing, useColors } from '../theme';

const FOLDERS = ['resenas', 'favoritos', 'tableros'] as const;
type Folder = (typeof FOLDERS)[number];

type State =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'ready'; profile: OwnProfile };

function counts(profile: OwnProfile) {
  const { reviews, followers, following, friends } = profile.counts;
  const plural = (value: number, one: string, many: string) =>
    `${formatCount(value)} ${value === 1 ? one : many}`;
  return [
    plural(reviews, 'RESEÑA', 'RESEÑAS'),
    plural(followers, 'SEGUIDOR', 'SEGUIDORES'),
    `${formatCount(following)} SIGUIENDO`,
    plural(friends, 'AMIGO', 'AMIGOS'),
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

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const desktop = useIsDesktop();
  const params = useLocalSearchParams<{ carpeta?: string }>();
  const folder: Folder = FOLDERS.includes(params.carpeta as Folder)
    ? (params.carpeta as Folder)
    : 'resenas';
  const session = getSession();
  const token = session?.token;
  const [state, setState] = useState<State>({ status: 'loading' });

  // Sesión caducada (al cargar o con un «Ver más»): a iniciar sesión otra vez.
  const onExpired = useCallback(() => {
    clearSession();
    router.replace({ pathname: '/acceso', params: { aviso: 'caducada' } });
  }, [router]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    getMyProfile(token).then((result) => {
      if (!active) return;
      if (result.ok) setState({ status: 'ready', profile: result.data });
      else if (result.needsLogin) onExpired();
      else setState({ status: 'error', error: result.error });
    });
    return () => {
      active = false;
    };
  }, [token, onExpired]);

  if (!session || !token) return <Redirect href="/acceso" />;

  const ink = { color: colors.ink };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <TopBar userName={session.user.name} />
      <ScrollView contentContainerStyle={[styles.content, desktop ? styles.contentDesktop : null]}>
        {state.status === 'loading' ? (
          <ActivityIndicator color={colors.accent} accessibilityLabel="Cargando" />
        ) : null}
        {state.status === 'error' ? (
          <Text accessibilityRole="alert" style={[styles.message, { color: colors.accentText }]}>
            {state.error}
          </Text>
        ) : null}
        {state.status === 'ready' ? (
          <>
            <View style={[styles.header, desktop ? styles.headerRow : null]}>
              <Text
                accessibilityRole="header"
                style={[styles.username, ink, usernameSize(state.profile.user.username, desktop)]}
              >
                @{state.profile.user.username.toUpperCase()}
              </Text>
              <Worm pose="cascos" width={desktop ? 130 : 96} />
              <View style={styles.about}>
                <Text style={[styles.name, ink]}>{state.profile.user.name}</Text>
                {state.profile.user.bio ? (
                  <Text style={[styles.bio, ink]}>{state.profile.user.bio}</Text>
                ) : null}
                <Text style={[styles.mono, ink]}>{counts(state.profile)}</Text>
              </View>
            </View>
            <FolderTabs
              tabs={[
                {
                  key: 'resenas',
                  label: `RESEÑAS · ${formatCount(state.profile.counts.reviews)}`,
                  shortLabel: 'RESEÑAS',
                },
                {
                  key: 'favoritos',
                  label: `FAVORITOS · ${formatCount(state.profile.counts.favorites)}`,
                  shortLabel: 'FAVORITOS',
                },
                {
                  key: 'tableros',
                  label: `TABLEROS · ${formatCount(state.profile.counts.boards)}`,
                  shortLabel: 'TABLEROS',
                },
              ]}
              active={folder}
              onChange={(key) => router.setParams({ carpeta: key })}
            >
              {folder === 'resenas' ? (
                <ProfileReviews
                  reviews={state.profile.reviews}
                  token={token}
                  onExpired={onExpired}
                />
              ) : null}
              {folder === 'favoritos' ? (
                <FavoritesFolder
                  favorites={state.profile.favorites}
                  token={token}
                  onExpired={onExpired}
                />
              ) : null}
              {folder === 'tableros' ? <BoardsGrid boards={state.profile.boards} /> : null}
            </FolderTabs>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: 16 },
  contentDesktop: { paddingHorizontal: 48, paddingTop: 32 },
  header: { gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 24, flexWrap: 'wrap' },
  username: { fontFamily: fonts.display },
  about: { gap: 6, flexShrink: 1, minWidth: 220 },
  name: { fontFamily: fonts.bodyExtraBold, fontSize: 18 },
  bio: { fontFamily: fonts.body, fontSize: 16 },
  mono: { fontFamily: fonts.mono, fontSize: 12 },
  message: { fontFamily: fonts.body, fontSize: 16 },
});

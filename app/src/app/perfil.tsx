// HU-06 · Consultar mi perfil (PA-06-01): tu información y las carpetas Reseñas,
// Favoritos (canciones, álbumes y artistas) y Tableros con todo tu contenido (diseño HertzPerfil).
// Las listas largas salen por partes, con «Ver más».
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useIsDesktop } from '../components/ItemPage';
import { folderFrom, ProfileView } from '../components/ProfileView';
import { TopBar } from '../components/TopBar';
import {
  getMyFavorites,
  getMyProfile,
  getMyReviews,
  type FavoriteType,
  type OwnProfile,
} from '../services/api';
import { clearSession, getSession } from '../services/session';
import { fonts, spacing, useColors } from '../theme';

type State =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'ready'; profile: OwnProfile };

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const desktop = useIsDesktop();
  const params = useLocalSearchParams<{ carpeta?: string }>();
  const folder = folderFrom(params.carpeta);
  const session = getSession();
  const token = session?.token;
  const [state, setState] = useState<State>({ status: 'loading' });

  // Sesión caducada (al cargar o con un «Ver más»): a iniciar sesión otra vez.
  const onExpired = useCallback(() => {
    clearSession();
    router.replace({ pathname: '/acceso', params: { aviso: 'caducada' } });
  }, [router]);

  const loadReviews = useCallback((offset: number) => getMyReviews(token ?? '', offset), [token]);
  const loadFavorites = useCallback(
    <K extends FavoriteType>(type: K, offset: number) => getMyFavorites(token ?? '', type, offset),
    [token],
  );

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
          <ProfileView
            profile={state.profile}
            own
            folder={folder}
            onFolderChange={(key) => router.setParams({ carpeta: key })}
            loadReviews={loadReviews}
            loadFavorites={loadFavorites}
            onExpired={onExpired}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: 16 },
  contentDesktop: { paddingHorizontal: 48, paddingTop: 32 },
  message: { fontFamily: fonts.body, fontSize: 16 },
});

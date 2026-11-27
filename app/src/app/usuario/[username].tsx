// HU-24 · Consultar el perfil de otro usuario (PA-24-01 a 03): su información y sus carpetas
// con lo que puedes ver (RN-08). Si hay un bloqueo entre los dos, no se muestra (RN-12).
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useIsDesktop } from '../../components/ItemPage';
import { folderFrom, ProfileView } from '../../components/ProfileView';
import { TopBar } from '../../components/TopBar';
import {
  getUserFavorites,
  getUserProfile,
  getUserReviews,
  type FavoriteType,
  type UserProfile,
} from '../../services/api';
import { clearSession, getSession } from '../../services/session';
import { fonts, spacing, useColors } from '../../theme';

type State =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'ready'; profile: UserProfile };

export default function UserProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const desktop = useIsDesktop();
  const params = useLocalSearchParams<{ username: string; carpeta?: string }>();
  const username = String(params.username ?? '');
  const folder = folderFrom(params.carpeta);
  const session = getSession();
  const token = session?.token;
  // Guardado con el usuario al que corresponde: al pasar a otro perfil, vuelve a «cargando».
  const [stored, setStored] = useState<{ key: string; state: State } | null>(null);
  const state: State = stored?.key === username ? stored.state : { status: 'loading' };

  const onExpired = useCallback(() => {
    clearSession();
    router.replace({ pathname: '/acceso', params: { aviso: 'caducada' } });
  }, [router]);
  const loadReviews = useCallback(
    (offset: number) => getUserReviews(username, offset, token),
    [username, token],
  );
  const loadFavorites = useCallback(
    <K extends FavoriteType>(type: K, offset: number) =>
      getUserFavorites(username, type, offset, token),
    [username, token],
  );

  useEffect(() => {
    let active = true;
    getUserProfile(username, token).then((result) => {
      if (!active) return;
      setStored({
        key: username,
        state: result.ok
          ? { status: 'ready', profile: result.data }
          : { status: 'error', error: result.error },
      });
    });
    return () => {
      active = false;
    };
  }, [username, token]);

  // Tu propio nombre de usuario lleva a tu perfil, con todo lo tuyo.
  if (state.status === 'ready' && state.profile.relationship.isMe) {
    return <Redirect href="/perfil" />;
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <TopBar userName={session?.user.name} />
      <ScrollView contentContainerStyle={[styles.content, desktop ? styles.contentDesktop : null]}>
        {state.status === 'loading' ? (
          <ActivityIndicator color={colors.accent} accessibilityLabel="Cargando" />
        ) : null}
        {state.status === 'error' ? (
          <Text accessibilityRole="alert" style={[styles.message, { color: colors.ink }]}>
            {state.error}
          </Text>
        ) : null}
        {state.status === 'ready' ? (
          <ProfileView
            profile={state.profile}
            own={false}
            folder={folder}
            onFolderChange={(key) => router.setParams({ carpeta: key })}
            loadReviews={loadReviews}
            loadFavorites={loadFavorites}
            onExpired={onExpired}
            actions={
              state.profile.relationship.isFriend ? (
                <Text style={[styles.badge, { color: colors.accentText }]}>✓ SOIS AMIGOS</Text>
              ) : null
            }
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
  badge: { fontFamily: fonts.monoMedium, fontSize: 12 },
});

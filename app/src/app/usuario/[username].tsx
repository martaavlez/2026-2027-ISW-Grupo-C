// HU-24 · Consultar el perfil de otro usuario (PA-24-01 a 03): su información y sus carpetas
// con lo que puedes ver (RN-08). Si hay un bloqueo entre los dos, no se muestra (RN-12).
// HU-41, HU-58 y HU-42 · Desde aquí se envía, cancela o responde la solicitud de amistad y se
// elimina la amistad. HU-10 y HU-48 · Y se sigue o se deja de seguir. HU-35 · Y se bloquea.
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BlockButton } from '../../components/BlockButton';
import { FollowButton } from '../../components/FollowButton';
import { FriendButton } from '../../components/FriendButton';
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
  // La carpeta Amigos solo está en tu perfil.
  const folder = folderFrom(params.carpeta === 'amigos' ? undefined : params.carpeta);
  const session = getSession();
  const token = session?.token;
  // Guardado con el usuario al que corresponde: al pasar a otro perfil, vuelve a «cargando».
  const [stored, setStored] = useState<{ key: string; state: State } | null>(null);
  const state: State = stored?.key === username ? stored.state : { status: 'loading' };
  // Al cambiar la amistad cambia lo que puedes ver: se vuelve a pedir el perfil.
  const [version, setVersion] = useState(0);

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
  }, [username, token, version]);

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
              token ? (
                <View style={styles.actions}>
                  <FollowButton
                    username={state.profile.user.username}
                    following={Boolean(state.profile.relationship.isFollowing)}
                    token={token}
                    onChange={() => setVersion((value) => value + 1)}
                    onExpired={onExpired}
                  />
                  <FriendButton
                    username={state.profile.user.username}
                    state={state.profile.relationship}
                    token={token}
                    onChange={() => setVersion((value) => value + 1)}
                    onExpired={onExpired}
                  />
                  <BlockButton
                    username={state.profile.user.username}
                    token={token}
                    onBlocked={() =>
                      router.replace({ pathname: '/perfil', params: { carpeta: 'amigos' } })
                    }
                    onExpired={onExpired}
                  />
                </View>
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
  actions: { gap: 10 },
});

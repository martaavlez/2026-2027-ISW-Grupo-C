// HU-06 · Consultar mi perfil (PA-06-01): tu información y las carpetas Reseñas,
// Favoritos (canciones, álbumes y artistas) y Tableros con todo tu contenido (diseño HertzPerfil).
// Las listas largas salen por partes, con «Ver más».
// HU-58 y HU-42 · En la carpeta Amigos respondes las solicitudes y eliminas amistades.
// HU-45 · «Editar perfil» cambia la foto, el nombre y la biografía. HU-17 · «Cerrar sesión».
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { FollowingList } from '../components/FollowingList';
import { FriendsFolder } from '../components/FriendsFolder';
import { useIsDesktop } from '../components/ItemPage';
import { ProfileEditor } from '../components/ProfileEditor';
import { folderFrom, ProfileView } from '../components/ProfileView';
import { TopBar } from '../components/TopBar';
import {
  getMyFavorites,
  getMyProfile,
  getMyReviews,
  type FavoriteType,
  type OwnProfile,
} from '../services/api';
import { clearSession, getSession, saveSession } from '../services/session';
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
  // Al aceptar o eliminar una amistad cambia el número de amigos: se vuelve a pedir el perfil.
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((value) => value + 1), []);
  const [editing, setEditing] = useState(false);

  // HU-17 · PA-17-01: se borra la sesión del navegador y se vuelve como visitante.
  const logOut = useCallback(() => {
    clearSession();
    router.replace({ pathname: '/acceso', params: { aviso: 'cerrada' } });
  }, [router]);

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
  }, [token, onExpired, version]);

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
            actions={
              editing ? (
                <ProfileEditor
                  user={state.profile.user}
                  token={token}
                  onCancel={() => setEditing(false)}
                  onExpired={onExpired}
                  onSaved={(name) => {
                    // La barra de arriba muestra la inicial del nombre guardado en la sesión.
                    saveSession({ ...session, user: { ...session.user, name } });
                    setEditing(false);
                    refresh();
                  }}
                />
              ) : (
                <View style={styles.actions}>
                  <Button
                    label="✎ Editar perfil"
                    variant="secondary"
                    onPress={() => setEditing(true)}
                  />
                  <Button label="Cerrar sesión" variant="secondary" onPress={logOut} />
                </View>
              )
            }
            friendsFolder={
              <View style={styles.people}>
                <FriendsFolder token={token} onExpired={onExpired} onChanged={refresh} />
                <FollowingList token={token} onExpired={onExpired} onChanged={refresh} />
              </View>
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
  actions: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 6 },
  people: { gap: 32 },
});

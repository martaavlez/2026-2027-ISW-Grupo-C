// HU-07 · «Mis favoritos»: canciones, álbumes y artistas marcados, del más reciente al más antiguo.
// Es la pestaña Favoritos del perfil (PA-07-01) mientras llega la HU del perfil, que la reutilizará.
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SearchResultList } from '../components/SearchResultList';
import { TopBar } from '../components/TopBar';
import { getMyFavorites, type Favorites } from '../services/api';
import { clearSession, getSession } from '../services/session';
import { fonts, spacing, useColors } from '../theme';

type State =
  { status: 'loading' } | { status: 'error'; error: string } | { status: 'ready'; data: Favorites };

export default function FavoritesScreen() {
  const colors = useColors();
  const router = useRouter();
  const session = getSession();
  const [state, setState] = useState<State>({ status: 'loading' });
  const token = session?.token;

  useEffect(() => {
    if (!token) return;
    let active = true;
    getMyFavorites(token).then((result) => {
      if (!active) return;
      if (result.ok) {
        setState({ status: 'ready', data: result.data });
      } else if (result.needsLogin) {
        clearSession();
        router.replace({ pathname: '/acceso', params: { aviso: 'caducada' } });
      } else {
        setState({ status: 'error', error: result.error });
      }
    });
    return () => {
      active = false;
    };
  }, [token, router]);

  if (!session) return <Redirect href="/acceso" />;

  const empty =
    state.status === 'ready' &&
    state.data.songs.length + state.data.albums.length + state.data.artists.length === 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <TopBar userName={session.user.name} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>
          MIS FAVORITOS
        </Text>
        {state.status === 'loading' ? (
          <ActivityIndicator color={colors.accent} accessibilityLabel="Cargando" />
        ) : null}
        {state.status === 'error' ? (
          <Text accessibilityRole="alert" style={[styles.message, { color: colors.accentText }]}>
            {state.error}
          </Text>
        ) : null}
        {empty ? (
          <Text style={[styles.message, { color: colors.ink }]}>
            Todavía no tienes favoritos. Márcalos con «♡ Favorito» en la ficha de una canción, un
            álbum o un artista.
          </Text>
        ) : null}
        {state.status === 'ready' && !empty ? (
          <SearchResultList results={{ query: '', ...state.data, users: [], communities: [] }} />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: 24, width: '100%', maxWidth: 960, alignSelf: 'center' },
  title: { fontFamily: fonts.display, fontSize: 72, lineHeight: 64, marginTop: spacing.md },
  message: { fontFamily: fonts.body, fontSize: 16 },
});

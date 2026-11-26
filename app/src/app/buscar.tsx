// HU-03 · Buscar contenido: canciones, álbumes, artistas, usuarios y comunidades.
// El término va en la dirección (/buscar?q=…) para poder volver atrás o compartir la búsqueda.
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '../components/Button';
import { useIsDesktop } from '../components/ItemPage';
import { SearchResultList } from '../components/SearchResultList';
import { TopBar } from '../components/TopBar';
import { MIN_SEARCH_LENGTH, useSearch } from '../features/search/useSearch';
import { getSession } from '../services/session';
import { fonts, offsetShadow, spacing, useColors } from '../theme';

const MAX_SEARCH_LENGTH = 100;
/** Al escribir, se busca solo a partir de 3 letras y tras una pausa breve (sin saturar la API). */
export const LIVE_SEARCH_MIN_LENGTH = 3;
export const LIVE_SEARCH_DELAY_MS = 350;

export default function SearchScreen() {
  const params = useLocalSearchParams<{ q?: string | string[] }>();
  const query = typeof params.q === 'string' ? params.q : '';
  const router = useRouter();
  const colors = useColors();
  const desktop = useIsDesktop();
  const [text, setText] = useState(query);
  const [hint, setHint] = useState<string | null>(null);
  const state = useSearch(query);

  // Búsqueda mientras se escribe: espera a que se deje de teclear un momento y actualiza la dirección.
  useEffect(() => {
    const term = text.trim();
    if (term.length < LIVE_SEARCH_MIN_LENGTH || term === query) return;
    const timer = setTimeout(() => {
      setHint(null);
      router.setParams({ q: term });
    }, LIVE_SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text, query, router]);

  function submit() {
    const term = text.trim();
    if (term.length < MIN_SEARCH_LENGTH) {
      setHint(`Escribe al menos ${MIN_SEARCH_LENGTH} caracteres.`);
      return;
    }
    setHint(null);
    router.setParams({ q: term });
  }

  const empty =
    state.status === 'ready' &&
    [
      state.results.songs,
      state.results.albums,
      state.results.artists,
      state.results.users,
      state.results.communities,
    ].every((list) => list.length === 0);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <TopBar userName={getSession()?.user.name} />
      <ScrollView contentContainerStyle={[styles.content, desktop ? styles.desktop : null]}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>
          ¿QUÉ BUSCAS?
        </Text>
        <View style={[styles.form, desktop ? styles.formRow : null]}>
          <TextInput
            accessibilityLabel="Término de búsqueda"
            placeholder="Canciones, álbumes, artistas, usuarios o comunidades"
            placeholderTextColor={colors.starEmpty}
            value={text}
            onChangeText={setText}
            onSubmitEditing={submit}
            returnKeyType="search"
            maxLength={MAX_SEARCH_LENGTH}
            autoFocus={!query}
            style={[
              styles.input,
              { color: colors.ink, borderColor: colors.ink, backgroundColor: colors.surface },
              offsetShadow(colors, 4),
            ]}
          />
          <Button label="Buscar" onPress={submit} />
        </View>
        {hint ? (
          <Text accessibilityRole="alert" style={[styles.message, { color: colors.accentText }]}>
            {hint}
          </Text>
        ) : null}
        {state.status === 'loading' ? (
          <ActivityIndicator color={colors.accent} accessibilityLabel="Buscando" />
        ) : null}
        {state.status === 'error' ? (
          <Text accessibilityRole="alert" style={[styles.message, { color: colors.accentText }]}>
            {state.error}
          </Text>
        ) : null}
        {empty ? (
          <Text style={[styles.message, { color: colors.ink }]}>
            No hay resultados para «{query}». Prueba con otras palabras.
          </Text>
        ) : null}
        {state.status === 'ready' && !empty ? <SearchResultList results={state.results} /> : null}
        {state.status === 'loading' && state.previous ? (
          <View style={styles.stale}>
            <SearchResultList results={state.previous} />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: 24, width: '100%', maxWidth: 960, alignSelf: 'center' },
  desktop: { paddingTop: 48 },
  title: { fontFamily: fonts.display, fontSize: 72, lineHeight: 64 },
  form: { gap: 16 },
  formRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
    minHeight: 52,
    borderWidth: 2.5,
    paddingHorizontal: 16,
    fontFamily: fonts.body,
    fontSize: 18,
    outlineStyle: 'none',
  } as object,
  message: { fontFamily: fonts.body, fontSize: 16 },
  stale: { opacity: 0.5 },
});

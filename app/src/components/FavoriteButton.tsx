import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { setFavorite, type FavoriteKind } from '../services/api';
import { clearSession, getSession } from '../services/session';
import { fonts, useColors } from '../theme';

type Props = { kind: FavoriteKind; id: string; initial: boolean };

/**
 * HU-07 y HU-46 · «♡ Favorito»: marca o quita el favorito al pulsar.
 * Se ve en el momento; si la API falla, vuelve como estaba y lo explica.
 */
export function FavoriteButton({ kind, id, initial }: Props) {
  const colors = useColors();
  const router = useRouter();
  const [favorite, setFavoriteState] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<'login' | string | null>(null);

  async function toggle() {
    const session = getSession();
    if (!session) {
      setMessage('login');
      return;
    }
    const next = !favorite;
    setFavoriteState(next);
    setSaving(true);
    setMessage(null);
    const result = await setFavorite(kind, id, next, session.token);
    setSaving(false);
    if (result.ok) return;
    setFavoriteState(!next);
    if (result.needsLogin) {
      clearSession();
      router.replace({ pathname: '/acceso', params: { aviso: 'caducada' } });
      return;
    }
    setMessage(result.error);
  }

  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={favorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
        accessibilityState={{ selected: favorite, disabled: saving }}
        aria-pressed={favorite}
        disabled={saving}
        onPress={toggle}
        style={[
          styles.button,
          {
            borderColor: colors.ink,
            backgroundColor: favorite ? colors.folderOpen : 'transparent',
          },
        ]}
      >
        <Text style={[styles.label, { color: colors.ink }]}>
          {favorite ? '♥ En favoritos' : '♡ Favorito'}
        </Text>
      </Pressable>
      {message === 'login' ? (
        <Text accessibilityRole="alert" style={[styles.message, { color: colors.ink }]}>
          Para guardar favoritos,{' '}
          <Link href="/acceso" style={[styles.link, { color: colors.accentText }]}>
            inicia sesión
          </Link>{' '}
          o{' '}
          <Link href="/registro" style={[styles.link, { color: colors.accentText }]}>
            crea una cuenta
          </Link>
          .
        </Text>
      ) : null}
      {message && message !== 'login' ? (
        <Text accessibilityRole="alert" style={[styles.message, { color: colors.accentText }]}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  button: { borderWidth: 2, paddingVertical: 11, alignItems: 'center' },
  label: { fontFamily: fonts.bodyBold, fontSize: 15 },
  message: { fontFamily: fonts.body, fontSize: 14 },
  link: { fontFamily: fonts.bodyBold, textDecorationLine: 'underline' },
});

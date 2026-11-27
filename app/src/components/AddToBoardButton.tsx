import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ItemKind } from '../services/api';
import { addToBoard, getMyBoardsFor, type MyBoardOption } from '../services/boards-api';
import { clearSession, getSession } from '../services/session';
import { fonts, useColors } from '../theme';
import { Button } from './Button';
import { BOARD_PRIVACY_LABELS } from './PrivacyPicker';

type State =
  | { status: 'closed' }
  | { status: 'login' }
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'ready'; boards: MyBoardOption[] };

/**
 * HU-25 · «+ A un tablero» en la ficha de una canción o un álbum (PA-25-01): eliges en cuál
 * de tus tableros guardarla. Los que ya la tienen salen marcados y no se repite (PA-25-02).
 */
export function AddToBoardButton({ kind, id }: { kind: ItemKind; id: string }) {
  const colors = useColors();
  const router = useRouter();
  const onExpired = () => {
    clearSession();
    router.replace({ pathname: '/acceso', params: { aviso: 'caducada' } });
  };
  const [state, setState] = useState<State>({ status: 'closed' });
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const ink = { color: colors.ink };
  const open = state.status !== 'closed';

  async function toggle() {
    if (open) {
      setState({ status: 'closed' });
      return;
    }
    const token = getSession()?.token;
    if (!token) {
      setState({ status: 'login' });
      return;
    }
    setState({ status: 'loading' });
    setMessages({});
    const result = await getMyBoardsFor(token, { kind, id });
    if (result.ok) setState({ status: 'ready', boards: result.data.items });
    else if (result.needsLogin) onExpired();
    else setState({ status: 'error', error: String(result.errors.form ?? '') });
  }

  async function add(board: MyBoardOption) {
    const token = getSession()?.token;
    if (!token || state.status !== 'ready') return;
    setBusy(board.id);
    const result = await addToBoard(token, board.id, { kind, id });
    setBusy(null);
    if (result.ok || result.errors.item) {
      // Añadido, o ya estaba (PA-25-02): en los dos casos, el tablero ya lo tiene.
      setState({
        status: 'ready',
        boards: state.boards.map((b) => (b.id === board.id ? { ...b, contains: true } : b)),
      });
      setMessages((current) => ({
        ...current,
        [board.id]: result.ok ? 'Añadido' : String(result.errors.item),
      }));
      return;
    }
    if (result.needsLogin) onExpired();
    else setMessages((current) => ({ ...current, [board.id]: String(result.errors.form ?? '') }));
  }

  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Añadir a un tablero"
        accessibilityState={{ expanded: open }}
        aria-expanded={open}
        onPress={toggle}
        style={[
          styles.button,
          { borderColor: colors.ink, backgroundColor: open ? colors.folderOpen : 'transparent' },
        ]}
      >
        <Text style={[styles.label, ink]}>+ A un tablero</Text>
      </Pressable>
      {state.status === 'login' ? (
        <Text accessibilityRole="alert" style={[styles.message, ink]}>
          Para guardar en tus tableros,{' '}
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
      {state.status === 'loading' ? (
        <Text style={[styles.message, ink]}>Cargando tus tableros…</Text>
      ) : null}
      {state.status === 'error' ? (
        <Text accessibilityRole="alert" style={[styles.message, { color: colors.accentText }]}>
          {state.error}
        </Text>
      ) : null}
      {state.status === 'ready' && state.boards.length === 0 ? (
        <Text style={[styles.message, ink]}>
          Todavía no tienes tableros.{' '}
          <Link href="/perfil?carpeta=tableros" style={[styles.link, { color: colors.accentText }]}>
            Crea uno en tu perfil
          </Link>
          .
        </Text>
      ) : null}
      {state.status === 'ready' && state.boards.length > 0 ? (
        <View style={[styles.list, { borderColor: colors.ink }]}>
          {state.boards.map((board, index) => (
            <View
              key={board.id}
              style={[
                styles.row,
                index > 0 ? { borderTopWidth: 2, borderTopColor: colors.ink } : null,
              ]}
            >
              <View style={styles.text}>
                <Text style={[styles.name, ink]}>{board.name}</Text>
                <Text style={[styles.mono, ink]}>{BOARD_PRIVACY_LABELS[board.privacy]}</Text>
                {messages[board.id] ? (
                  <Text style={[styles.message, { color: colors.accentText }]}>
                    {messages[board.id]}
                  </Text>
                ) : null}
              </View>
              {board.contains ? (
                <Text style={[styles.mono, ink]} accessibilityLabel={`Ya está en ${board.name}`}>
                  ✓ YA ESTÁ
                </Text>
              ) : (
                <Button
                  label="Añadir"
                  variant="secondary"
                  loading={busy === board.id}
                  accessibilityLabel={`Añadir a ${board.name}`}
                  onPress={() => add(board)}
                />
              )}
            </View>
          ))}
        </View>
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
  list: { borderWidth: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10 },
  text: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.bodyBold, fontSize: 15 },
  mono: { fontFamily: fonts.mono, fontSize: 11 },
});

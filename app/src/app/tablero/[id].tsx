// Tablero abierto (diseño HertzTablero). Cualquiera que pueda verlo (RN-08) ve su contenido;
// su dueño, además: HU-25 · añadir, HU-49 · quitar, HU-26 · editar (nombre, descripción y
// portada), HU-34 · privacidad y HU-50 · eliminar con confirmación.
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AddToThisBoard } from '../../components/AddToThisBoard';
import { BoardForm } from '../../components/BoardForm';
import { BoardItemList } from '../../components/BoardItemList';
import { Button } from '../../components/Button';
import { CdCase } from '../../components/CdCase';
import { ItemStatus, titleSize, useIsDesktop } from '../../components/ItemPage';
import { PrivacyPicker } from '../../components/PrivacyPicker';
import { TopBar } from '../../components/TopBar';
import { formatCount } from '../../features/catalog/format';
import type { FieldErrors, Privacy } from '../../services/api';
import {
  deleteBoard,
  getBoard,
  removeFromBoard,
  updateBoard,
  type Board,
  type BoardResult,
} from '../../services/boards-api';
import { clearSession, getSession } from '../../services/session';
import { fonts, spacing, useColors } from '../../theme';

type State =
  | { status: 'loading' }
  | { status: 'error'; error: string; notFound: boolean }
  | { status: 'ready'; board: Board };

type Panel = 'none' | 'add' | 'edit' | 'delete';

const plural = (value: number, one: string, many: string) =>
  `${formatCount(value)} ${value === 1 ? one : many}`;

export default function BoardScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = String(rawId);
  const colors = useColors();
  const router = useRouter();
  const desktop = useIsDesktop();
  const session = getSession();
  const token = session?.token;
  const [state, setState] = useState<State>({ status: 'loading' });
  const [version, setVersion] = useState(0);
  const [panel, setPanel] = useState<Panel>('none');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  const ink = { color: colors.ink };

  const onExpired = useCallback(() => {
    clearSession();
    router.replace({ pathname: '/acceso', params: { aviso: 'caducada' } });
  }, [router]);

  useEffect(() => {
    let active = true;
    getBoard(id, token).then((result) => {
      if (!active) return;
      if (result.ok) setState({ status: 'ready', board: result.data });
      else if (result.needsLogin) onExpired();
      else {
        setState({
          status: 'error',
          error: result.notFound ? 'Este tablero no está disponible.' : String(result.errors.form),
          notFound: result.notFound,
        });
      }
    });
    return () => {
      active = false;
    };
  }, [id, token, version, onExpired]);

  /** Tras un cambio: si ha ido bien, el tablero nuevo; si no, los avisos. */
  async function apply<T>(call: () => Promise<BoardResult<T>>, done?: (data: T) => void) {
    if (!token) {
      onExpired();
      return false;
    }
    setSaving(true);
    setErrors({});
    const result = await call();
    setSaving(false);
    if (result.ok) {
      done?.(result.data);
      return true;
    }
    if (result.needsLogin) onExpired();
    else setErrors(result.errors);
    return false;
  }

  if (state.status === 'loading') return <ItemStatus loading />;
  if (state.status === 'error') {
    return <ItemStatus message={state.error} onRetry={state.notFound ? undefined : reload} />;
  }

  const board = state.board;
  const owner = board.isOwner && Boolean(token);
  const showBoard = (next: Board) => setState({ status: 'ready', board: next });
  const size = Math.min(titleSize(board.name, desktop), desktop ? 112 : 64);
  const back = owner
    ? { href: '/perfil?carpeta=tableros', label: '← Mis tableros' }
    : {
        href: `/usuario/${encodeURIComponent(board.owner.username)}?carpeta=tableros`,
        label: `← Perfil de @${board.owner.username}`,
      };

  const changePrivacy = (privacy: Privacy) =>
    apply(() => updateBoard(token ?? '', board.id, { privacy }), showBoard);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <TopBar userName={session?.user.name} />
      <ScrollView contentContainerStyle={[styles.content, desktop ? styles.contentDesktop : null]}>
        <Link href={back.href} style={[styles.back, ink]}>
          {back.label}
        </Link>
        <View style={desktop ? styles.row : styles.column}>
          <CdCase
            coverUrl={board.items.length ? board.coverUrl : null}
            size={desktop ? 340 : 220}
            discOut={board.items.length > 0}
          />
          <View style={styles.info}>
            <Text style={[styles.mono, ink]}>
              {[
                `TABLERO DE @${board.owner.username.toUpperCase()}`,
                plural(board.itemsCount, 'ELEMENTO', 'ELEMENTOS'),
                plural(board.followersCount, 'SEGUIDOR', 'SEGUIDORES'),
              ].join(' · ')}
            </Text>
            <Text
              accessibilityRole="header"
              style={[styles.title, ink, { fontSize: size, lineHeight: size * 0.88 }]}
            >
              {board.name.toUpperCase()}
            </Text>
            {board.description ? (
              <Text style={[styles.description, ink]}>{board.description}</Text>
            ) : null}
            {owner ? (
              <View style={styles.ownerBar}>
                <View style={styles.actions}>
                  <Button
                    label="+ Añadir canción o álbum"
                    variant="dark"
                    onPress={() => setPanel(panel === 'add' ? 'none' : 'add')}
                  />
                  <Button
                    label="Editar"
                    variant="secondary"
                    onPress={() => {
                      setErrors({});
                      setPanel(panel === 'edit' ? 'none' : 'edit');
                    }}
                  />
                  <Button
                    label="•••"
                    variant="secondary"
                    onPress={() => setPanel(panel === 'delete' ? 'none' : 'delete')}
                  />
                </View>
                <PrivacyPicker
                  label="Privacidad del tablero"
                  value={board.privacy ?? 'public'}
                  disabled={saving}
                  onChange={changePrivacy}
                />
                {panel === 'none' && (errors.form || errors.privacy) ? (
                  <Text
                    accessibilityRole="alert"
                    style={[styles.error, { color: colors.accentText }]}
                  >
                    {errors.form ?? errors.privacy}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>

        {owner && panel === 'edit' ? (
          <BoardForm
            title="EDITAR TABLERO"
            initial={{
              name: board.name,
              description: board.description ?? '',
              privacy: board.privacy ?? 'public',
              coverItemId: board.coverItemId ?? null,
            }}
            coverItems={board.items}
            submitLabel="Guardar cambios"
            saving={saving}
            errors={errors}
            onCancel={() => setPanel('none')}
            onSubmit={({ name, description, coverItemId }) =>
              apply(
                () => updateBoard(token ?? '', board.id, { name, description, coverItemId }),
                (next) => {
                  showBoard(next);
                  setPanel('none');
                },
              )
            }
          />
        ) : null}

        {owner && panel === 'delete' ? (
          <View
            style={[styles.confirm, { borderColor: colors.ink, backgroundColor: colors.surface }]}
          >
            <Text style={[styles.description, ink]}>
              ¿Eliminar el tablero «{board.name}»? Se borra con todo su contenido y deja de verse en
              tu perfil y en el de quienes lo siguen. No se puede deshacer.
            </Text>
            {errors.form ? (
              <Text accessibilityRole="alert" style={[styles.error, { color: colors.accentText }]}>
                {errors.form}
              </Text>
            ) : null}
            <View style={styles.actions}>
              <Button
                label="Cancelar"
                variant="secondary"
                disabled={saving}
                onPress={() => setPanel('none')}
              />
              <Button
                label="Sí, eliminar tablero"
                loading={saving}
                onPress={() =>
                  apply(
                    () => deleteBoard(token ?? '', board.id),
                    () => router.replace({ pathname: '/perfil', params: { carpeta: 'tableros' } }),
                  )
                }
              />
            </View>
          </View>
        ) : null}

        {owner && panel === 'add' ? (
          <AddToThisBoard
            boardId={board.id}
            inBoard={new Set(board.items.map((item) => `${item.kind}-${item.catalogId}`))}
            token={token ?? ''}
            onExpired={onExpired}
            onAdded={reload}
            onClose={() => setPanel('none')}
          />
        ) : null}

        <BoardItemList
          items={board.items}
          emptyText={
            owner
              ? 'Tu tablero está vacío. Añade canciones o álbumes desde aquí o desde sus fichas.'
              : 'Este tablero está vacío.'
          }
          onRemove={
            owner
              ? (item) =>
                  apply(
                    () => removeFromBoard(token ?? '', board.id, item.id),
                    () => {
                      // Se ve en el momento; el número y la portada se recalculan al volver a pedirlo.
                      reload();
                    },
                  )
              : undefined
          }
          removing={saving}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: 28, paddingBottom: 64 },
  contentDesktop: { paddingHorizontal: 48, paddingTop: 32 },
  back: { fontFamily: fonts.mono, fontSize: 13 },
  row: { flexDirection: 'row', gap: 48, alignItems: 'flex-start' },
  column: { gap: 24 },
  info: { flex: 1, minWidth: 0, gap: 14 },
  mono: { fontFamily: fonts.mono, fontSize: 12 },
  title: { fontFamily: fonts.display },
  description: { fontFamily: fonts.body, fontSize: 16, maxWidth: 640 },
  ownerBar: { gap: 12, marginTop: 6 },
  actions: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  confirm: { borderWidth: 2, padding: 18, gap: 12, maxWidth: 560 },
  error: { fontFamily: fonts.body, fontSize: 14 },
});

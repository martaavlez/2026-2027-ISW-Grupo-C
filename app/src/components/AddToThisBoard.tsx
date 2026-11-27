import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { MIN_SEARCH_LENGTH, useSearch } from '../features/search/useSearch';
import type { ItemKind } from '../services/api';
import { addToBoard } from '../services/boards-api';
import { fonts, useColors } from '../theme';
import { Button } from './Button';
import { Row, Thumb } from './SearchResultList';

const RESULTS = 5;
const detail = (type: string, artists: { name: string }[]) =>
  [type, artists.map((artist) => artist.name).join(', ')].filter(Boolean).join(' · ');

/**
 * HU-25 · «+ Añadir canción o álbum» dentro del tablero: se busca en el catálogo (HU-03) y
 * se añade con un toque. Si ya estaba, se avisa y no se repite (PA-25-02).
 */
export function AddToThisBoard({
  boardId,
  inBoard,
  token,
  onAdded,
  onExpired,
  onClose,
}: {
  boardId: string;
  /** Lo que ya tiene el tablero, como «song-3» o «album-7»: sale marcado (PA-25-02). */
  inBoard: Set<string>;
  token: string;
  onAdded: () => void;
  onExpired: () => void;
  onClose: () => void;
}) {
  const colors = useColors();
  const [term, setTerm] = useState('');
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const state = useSearch(term);
  const ink = { color: colors.ink };
  const results =
    state.status === 'ready'
      ? state.results
      : state.status === 'loading'
        ? state.previous
        : undefined;

  async function add(kind: ItemKind, id: string) {
    const key = `${kind}-${id}`;
    setBusy(key);
    const result = await addToBoard(token, boardId, { kind, id });
    setBusy(null);
    if (result.ok) {
      setMessages((current) => ({ ...current, [key]: 'Añadido' }));
      onAdded();
      return;
    }
    if (result.needsLogin) {
      onExpired();
      return;
    }
    const error = result.errors.item ?? result.errors.form ?? Object.values(result.errors)[0] ?? '';
    setMessages((current) => ({ ...current, [key]: String(error) }));
  }

  const action = (kind: ItemKind, id: string, title: string) => {
    const key = `${kind}-${id}`;
    if (inBoard.has(key) && !messages[key]) {
      return (
        <Text
          style={[styles.mono, { color: colors.ink }]}
          accessibilityLabel={`${title} ya está en el tablero`}
        >
          ✓ YA ESTÁ
        </Text>
      );
    }
    return messages[key] ? (
      <Text style={[styles.note, { color: colors.accentText }]}>{messages[key]}</Text>
    ) : (
      <Button
        label="+ Añadir"
        variant="secondary"
        loading={busy === key}
        onPress={() => add(kind, id)}
        accessibilityLabel={`Añadir ${title} al tablero`}
      />
    );
  };

  return (
    <View style={[styles.panel, { borderColor: colors.ink, backgroundColor: colors.surface }]}>
      <Text accessibilityRole="header" style={[styles.heading, ink]}>
        AÑADIR CANCIÓN O ÁLBUM
      </Text>
      <TextInput
        accessibilityLabel="Buscar canciones o álbumes"
        placeholder="Busca una canción o un álbum"
        placeholderTextColor={colors.starEmpty}
        value={term}
        onChangeText={setTerm}
        maxLength={100}
        autoFocus
        style={[styles.input, { borderColor: colors.ink, color: colors.ink }]}
      />
      {term.trim().length > 0 && term.trim().length < MIN_SEARCH_LENGTH ? (
        <Text style={[styles.note, ink]}>Escribe al menos {MIN_SEARCH_LENGTH} letras.</Text>
      ) : null}
      {state.status === 'error' ? (
        <Text accessibilityRole="alert" style={[styles.note, { color: colors.accentText }]}>
          {state.error}
        </Text>
      ) : null}
      {results ? (
        <View>
          {results.songs.slice(0, RESULTS).map((song) => (
            <Row
              key={`song-${song.id}`}
              thumb={<Thumb url={song.coverUrl} label={song.title} />}
              title={song.title}
              detail={detail('CANCIÓN', song.artists)}
              actions={action('song', song.id, song.title)}
            />
          ))}
          {results.albums.slice(0, RESULTS).map((album) => (
            <Row
              key={`album-${album.id}`}
              thumb={<Thumb url={album.coverUrl} label={album.title} />}
              title={album.title}
              detail={detail('ÁLBUM', album.artists)}
              actions={action('album', album.id, album.title)}
            />
          ))}
          {results.songs.length === 0 && results.albums.length === 0 ? (
            <Text style={[styles.note, ink]}>
              No hay canciones ni álbumes con «{results.query}».
            </Text>
          ) : null}
        </View>
      ) : null}
      <View style={styles.close}>
        <Button label="Hecho" variant="secondary" onPress={onClose} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { borderWidth: 2, padding: 18, gap: 12, maxWidth: 720, width: '100%' },
  heading: { fontFamily: fonts.monoMedium, fontSize: 13 },
  input: {
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  note: { fontFamily: fonts.body, fontSize: 14 },
  mono: { fontFamily: fonts.mono, fontSize: 11 },
  close: { alignSelf: 'flex-end' },
});

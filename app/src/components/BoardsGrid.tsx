import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { formatCount } from '../features/catalog/format';
import type { ProfileBoard } from '../services/api';
import { fonts, useColors } from '../theme';
import { CdCase } from './CdCase';
import { useIsDesktop } from './ItemPage';

// «tablero» es masculino: público, solo amigos, privado (diseño HertzPerfil).
const BOARD_PRIVACY = { public: 'PÚBLICO', friends: 'SOLO AMIGOS', private: 'PRIVADO' } as const;

/**
 * Carpeta Tableros del perfil: cada tablero como una caja de CD con la portada de uno de sus
 * discos o canciones. El dueño elige cuál al editar el tablero; si no ha elegido, sale la del
 * primero que añadió, y un tablero vacío sale con el disco del color del tema.
 * Solo para verlos; crear, abrir y editar tableros llega con sus propias HU.
 */
export function BoardsGrid({
  boards,
  emptyText = 'Todavía no tienes tableros.',
}: {
  boards: ProfileBoard[];
  emptyText?: string;
}) {
  const colors = useColors();
  const desktop = useIsDesktop();
  const { width } = useWindowDimensions();
  // En el móvil, dos cajas por fila: el ancho menos los márgenes de la pantalla y la carpeta.
  const size = desktop ? 180 : Math.max(100, Math.min(160, Math.floor((width - 48 - 56 - 28) / 2)));
  const ink = { color: colors.ink };
  return (
    <View style={styles.wrapper}>
      <Text style={[styles.help, ink]}>
        Crea tableros personalizados para organizar y guardar tus canciones y álbumes favoritos.
      </Text>
      {boards.length === 0 ? <Text style={[styles.help, ink]}>{emptyText}</Text> : null}
      <View style={styles.grid}>
        {boards.map((board) => (
          <View key={board.id} style={{ width: size }}>
            <CdCase coverUrl={board.coverUrl} size={size} />
            <View style={styles.caption}>
              <Text style={[styles.name, ink]}>{board.name}</Text>
              <Text style={[styles.mono, ink]}>
                {formatCount(board.itemsCount)} {board.itemsCount === 1 ? 'ELEMENTO' : 'ELEMENTOS'}{' '}
                · {BOARD_PRIVACY[board.privacy]}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 20 },
  help: { fontFamily: fonts.body, fontSize: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 20, rowGap: 24 },
  // El nombre y los datos, separados de la sombra de la caja.
  caption: { marginTop: 10, gap: 4 },
  name: { fontFamily: fonts.bodyBold, fontSize: 15 },
  mono: { fontFamily: fonts.mono, fontSize: 11 },
});

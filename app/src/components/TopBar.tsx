import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts, useColors } from '../theme';
import { Logo } from './Logo';

/**
 * Barra superior: HERTZ a la izquierda; a la derecha la lupa del buscador (HU-03) y el avatar.
 * Sin sesión (visitante), en lugar del avatar sale «CREAR CUENTA».
 * Los enlaces INICIO · DESCUBRIR · COMUNIDAD se añaden con sus HU.
 */
export function TopBar({ userName }: { userName?: string }) {
  const colors = useColors();
  return (
    <View style={[styles.bar, { borderBottomColor: colors.ink }]}>
      <Logo />
      <View style={styles.right}>
        <SearchLink />
        {userName ? <UserAvatar userName={userName} /> : <SignUpLink />}
      </View>
    </View>
  );
}

/** Lupa dibujada con dos piezas (aro y mango), como el icono del diseño. */
function SearchLink() {
  const colors = useColors();
  return (
    <Link href="/buscar" asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Buscar"
        hitSlop={8}
        style={styles.search}
      >
        <View style={[styles.lens, { borderColor: colors.ink }]} />
        <View style={[styles.handle, { backgroundColor: colors.ink }]} />
      </Pressable>
    </Link>
  );
}

function SignUpLink() {
  const colors = useColors();
  return (
    <Link
      href="/registro"
      style={[styles.signUp, { color: colors.ink, borderBottomColor: colors.accent }]}
    >
      CREAR CUENTA
    </Link>
  );
}

function UserAvatar({ userName }: { userName: string }) {
  const colors = useColors();
  return (
    <View
      accessibilityLabel="Tu perfil"
      style={[
        styles.avatar,
        {
          borderColor: colors.ink,
          backgroundColor: colors.folderOpen,
          boxShadow: `0 0 0 3px ${colors.background}, 0 0 0 5px ${colors.accent}`,
        },
      ]}
    >
      <Text style={[styles.initial, { color: colors.ink }]}>
        {userName.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 64,
    borderBottomWidth: 2,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  right: { flexDirection: 'row', alignItems: 'center', gap: 28 },
  search: { width: 22, height: 22 },
  lens: {
    position: 'absolute',
    left: 1,
    top: 1,
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 2,
  },
  handle: {
    position: 'absolute',
    left: 13,
    top: 16,
    width: 8,
    height: 2,
    transform: [{ rotate: '45deg' }],
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { fontFamily: fonts.bodyExtraBold, fontSize: 15 },
  signUp: { fontFamily: fonts.mono, fontSize: 13, borderBottomWidth: 2, paddingBottom: 3 },
});

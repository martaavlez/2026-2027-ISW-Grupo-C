import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { fonts, useColors } from '../theme';
import { Logo } from './Logo';

/**
 * Barra superior: HERTZ a la izquierda y el avatar a la derecha. Sin sesión (visitante),
 * en lugar del avatar sale «CREAR CUENTA».
 * Los enlaces INICIO · DESCUBRIR · COMUNIDAD y la lupa se añaden con sus HU.
 */
export function TopBar({ userName }: { userName?: string }) {
  const colors = useColors();
  return (
    <View style={[styles.bar, { borderBottomColor: colors.ink }]}>
      <Logo />
      {userName ? <UserAvatar userName={userName} /> : <SignUpLink />}
    </View>
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

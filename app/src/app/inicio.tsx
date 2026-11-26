// Inicio de un usuario recién registrado, todavía sin datos (simplificada).
// El disco de la semana, el ranking y las recomendaciones llegarán con sus propias HU.
import { Link, Redirect } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { TopBar } from '../components/TopBar';
import { Worm } from '../components/Worm';
import { getSession } from '../services/session';
import { fonts, spacing, useColors } from '../theme';

export default function HomeScreen() {
  const colors = useColors();
  const session = getSession();
  if (!session) return <Redirect href="/" />;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <TopBar userName={session.user.name} />
      <ScrollView contentContainerStyle={styles.content}>
        <Worm pose="hola" width={220} />
        <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>
          ¡HOLA, {session.user.name.toUpperCase()}!
        </Text>
        <Text style={[styles.text, { color: colors.ink }]}>
          Tu cuenta está lista. Cuando empieces a valorar música, aquí verás el disco de la semana,
          el ranking y recomendaciones para ti.
        </Text>
        <Link
          href="/favoritos"
          style={[styles.link, { color: colors.ink, borderBottomColor: colors.accent }]}
        >
          MIS FAVORITOS →
        </Link>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  title: {
    fontFamily: fonts.display,
    fontSize: 72,
    lineHeight: 64,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  link: {
    fontFamily: fonts.mono,
    fontSize: 14,
    borderBottomWidth: 2,
    paddingBottom: 3,
    marginTop: spacing.lg,
  },
  text: {
    fontFamily: fonts.body,
    fontSize: 17,
    lineHeight: 25,
    textAlign: 'center',
    maxWidth: 520,
    marginTop: spacing.md,
  },
});

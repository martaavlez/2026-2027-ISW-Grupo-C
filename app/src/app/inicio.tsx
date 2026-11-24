// Inicio de un usuario recién registrado, todavía sin datos (M02, simplificada).
// Las recomendaciones y el ranking llegarán con sus propias HU.
import { Redirect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Logo } from '../components/Logo';
import { Screen } from '../components/Screen';
import { getSession } from '../services/session';
import { colors, fonts, spacing } from '../theme';

export default function HomeScreen() {
  const session = getSession();
  if (!session) return <Redirect href="/" />;

  return (
    <Screen centered>
      <View style={styles.content}>
        <Logo />
        <Text style={styles.title}>¡Hola, {session.user.name}!</Text>
        <Text style={styles.text}>
          Tu cuenta está lista. Cuando empieces a valorar música, aquí verás tus recomendaciones y
          el ranking de la semana.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, alignItems: 'center' },
  title: { fontFamily: fonts.heading, fontSize: 28, color: colors.text, textAlign: 'center' },
  text: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

// A01 · Bienvenida para visitantes (HU-01 · Flujo 1).
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { Logo } from '../components/Logo';
import { Screen } from '../components/Screen';
import { colors, fonts, spacing } from '../theme';

const TILES = [colors.pink, colors.cyan, colors.yellow];

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <Screen>
      <View style={styles.content}>
        <Logo size={40} />
        <Text style={styles.title}>Reseña, valora y comparte la música que te mueve</Text>
        <View style={styles.tiles}>
          {TILES.map((color) => (
            <View key={color} style={styles.tile}>
              <Text style={[styles.note, { color }]}>♫</Text>
            </View>
          ))}
        </View>
        <Text style={styles.description}>
          Descubre lo más valorado de la semana, sigue a tus amigos y crea tus propios tableros.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button label="Crear cuenta" onPress={() => router.push('/registro')} />
        {/* Se activa con la HU-02 · Iniciar sesión. */}
        <Button label="Iniciar sesión" variant="secondary" onPress={() => {}} disabled />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, gap: spacing.xl, alignItems: 'center', justifyContent: 'center' },
  title: {
    fontFamily: fonts.heading,
    fontSize: 24,
    lineHeight: 28,
    color: colors.text,
    textAlign: 'center',
  },
  tiles: { flexDirection: 'row', gap: spacing.md },
  tile: {
    width: 88,
    height: 88,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: { fontSize: 34 },
  description: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: 'center',
  },
  actions: { gap: spacing.md, paddingBottom: spacing.sm },
});

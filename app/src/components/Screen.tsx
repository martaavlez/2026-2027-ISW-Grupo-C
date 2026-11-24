import { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { colors, gridBackground, spacing } from '../theme';

/** Contenedor de cada pantalla: fondo oscuro con cuadrícula y ancho máximo de móvil. */
export function Screen({
  children,
  centered = false,
}: {
  children: ReactNode;
  centered?: boolean;
}) {
  return (
    <ScrollView
      style={[styles.screen, gridBackground]}
      contentContainerStyle={[styles.content, centered ? styles.centered : null]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    flexGrow: 1,
    gap: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  centered: { justifyContent: 'center' },
});

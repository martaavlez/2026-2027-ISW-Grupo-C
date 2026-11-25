import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { DESKTOP_MIN_WIDTH, fonts, spacing, useColors } from '../theme';
import { Worm } from './Worm';

/**
 * Composición de las pantallas de entrada (HertzAcceso y HertzRegistro):
 * la marca a la izquierda y la carpeta con el formulario a la derecha.
 * En el móvil, la marca va arriba y más pequeña.
 */
export function EntryLayout({ children }: { children: ReactNode }) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const desktop = width >= DESKTOP_MIN_WIDTH;
  const logoSize = desktop ? Math.min(250, width * 0.17) : 96;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.page, desktop ? styles.pageDesktop : null]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.brand, desktop ? styles.brandDesktop : null]}>
        <Text style={[styles.tagline, { color: colors.ink }]}>RESEÑA · VALORA · COMPARTE</Text>
        <View style={styles.logoRow}>
          <Text
            accessibilityRole="header"
            style={[
              styles.logo,
              { color: colors.ink, fontSize: logoSize, lineHeight: logoSize * 0.82 },
            ]}
          >
            HERTZ
          </Text>
          {desktop ? null : <Worm pose="cascos" width={104} />}
        </View>
        <Text style={[styles.claim, { color: colors.ink }, desktop ? styles.claimDesktop : null]}>
          La música que te mueve, ordenada a tu manera y comentada con tu gente.
        </Text>
        {desktop ? (
          <View style={styles.wormDesktop}>
            <Worm pose="cascos" width={330} />
          </View>
        ) : null}
      </View>
      <View style={[styles.form, desktop ? styles.formDesktop : null]}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: spacing.lg, gap: spacing.lg },
  pageDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 72,
    paddingVertical: 64,
    gap: 72,
  },
  brand: { gap: spacing.sm + 4 },
  brandDesktop: { flex: 1, gap: 20, maxWidth: 660 },
  tagline: { fontFamily: fonts.mono, fontSize: 13 },
  logo: { fontFamily: fonts.display, letterSpacing: -2 },
  claim: { fontFamily: fonts.body, fontSize: 18, lineHeight: 25, maxWidth: 520 },
  claimDesktop: { fontSize: 24, lineHeight: 32 },
  wormDesktop: { alignSelf: 'center', marginTop: spacing.lg },
  logoRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  form: { width: '100%' },
  formDesktop: { width: 520, maxWidth: '45%' },
});

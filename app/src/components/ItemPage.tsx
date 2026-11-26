import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { getSession } from '../services/session';
import { DESKTOP_MIN_WIDTH, fonts, spacing, useColors } from '../theme';
import { Button } from './Button';
import { TopBar } from './TopBar';

/** Título enorme del diseño, más pequeño cuanto más largo para que no se salga. */
export function titleSize(title: string, desktop: boolean): number {
  const max = desktop ? 150 : 72;
  const min = desktop ? 56 : 40;
  const fit = (desktop ? 1500 : 560) / Math.max(title.length, 1);
  return Math.round(Math.max(min, Math.min(max, fit)));
}

/**
 * Estructura de la ficha: barra superior y dos columnas. En móvil va todo en una columna
 * y la cabecera (tipo, título y artista) sube arriba del todo para verla sin bajar.
 */
export function ItemPage({
  header,
  aside,
  children,
}: {
  header: ReactNode;
  aside: ReactNode;
  children: ReactNode;
}) {
  const colors = useColors();
  const desktop = useIsDesktop();
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <TopBar userName={getSession()?.user.name} />
      <ScrollView contentContainerStyle={[styles.content, desktop ? styles.row : styles.column]}>
        {desktop ? null : <View style={styles.headerMobile}>{header}</View>}
        <View style={desktop ? styles.aside : styles.asideMobile}>{aside}</View>
        <View style={desktop ? styles.main : styles.mainMobile}>
          {desktop ? header : null}
          {children}
        </View>
      </ScrollView>
    </View>
  );
}

/** Mientras carga, o si no existe o falla la conexión. */
export function ItemStatus({
  loading,
  message,
  onRetry,
}: {
  loading?: boolean;
  message?: string;
  onRetry?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <TopBar userName={getSession()?.user.name} />
      <View style={styles.status}>
        {loading ? (
          <ActivityIndicator color={colors.accent} accessibilityLabel="Cargando" />
        ) : (
          <>
            <Text style={[styles.message, { color: colors.ink }]}>{message}</Text>
            {onRetry ? <Button label="Reintentar" variant="secondary" onPress={onRetry} /> : null}
          </>
        )}
      </View>
    </View>
  );
}

export function useIsDesktop() {
  return useWindowDimensions().width >= DESKTOP_MIN_WIDTH;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: 40, paddingBottom: 64, gap: 48 },
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 48, gap: 64 },
  column: { flexDirection: 'column', paddingTop: spacing.lg, gap: spacing.lg },
  aside: { width: 420, gap: 22 },
  asideMobile: { gap: 22 },
  headerMobile: { gap: 16 },
  mainMobile: { gap: 20 },
  main: { flex: 1, minWidth: 0, gap: 20 },
  status: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  message: { fontFamily: fonts.body, fontSize: 17, textAlign: 'center', maxWidth: 480 },
});

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts, offsetShadow, useColors } from '../theme';
import { useIsDesktop } from './ItemPage';

/** `shortLabel` se usa en móvil, donde no cabe el texto entero (por ejemplo, sin el número). */
export type FolderTab = { key: string; label: string; shortLabel?: string };

type Props = {
  tabs: FolderTab[];
  active: string;
  onChange: (key: string) => void;
  children: ReactNode;
};

const TAB_HEIGHT = 36;
// Las pestañas de detrás quedan escalonadas hacia arriba, como en el diseño del perfil.
const BACK_TAB_TOPS = [-34, -46];

/**
 * Carpetas con varias pestañas (perfil · HU-06): la abierta delante, en color y con punto rosa,
 * y las demás detrás en kraft. Al pulsar una pestaña de detrás, esa carpeta pasa delante.
 */
export function FolderTabs({ tabs, active, onChange, children }: Props) {
  const colors = useColors();
  const desktop = useIsDesktop();
  const border = { borderColor: colors.ink };
  // En móvil las tres pestañas caben en una fila, sin solaparse.
  const layout = desktop
    ? { width: '22%', start: 27, step: 24, frontWidth: '24%' }
    : { width: '30%', start: 38, step: 31, frontWidth: '36%' };
  const compact = desktop ? null : styles.compact;
  const activeTab = tabs.find((tab) => tab.key === active) ?? tabs[0];
  const backTabs = tabs.filter((tab) => tab.key !== activeTab.key);

  return (
    <View accessibilityRole="tablist" style={styles.container}>
      <View style={[styles.backFolder, border, { backgroundColor: colors.kraft }]} />
      {backTabs.map((tab, index) => (
        <Pressable
          key={tab.key}
          accessibilityRole="tab"
          accessibilityLabel={tab.label}
          accessibilityState={{ selected: false }}
          aria-selected={false}
          onPress={() => onChange(tab.key)}
          style={[
            styles.tab,
            styles.backTab,
            border,
            compact,
            {
              backgroundColor: colors.kraft,
              width: layout.width as `${number}%`,
              left: `${layout.start + index * layout.step}%`,
              top: desktop ? (BACK_TAB_TOPS[index] ?? -46) : -30,
            },
          ]}
        >
          <Text numberOfLines={1} style={[styles.tabText, { color: colors.ink }]}>
            {desktop ? tab.label : (tab.shortLabel ?? tab.label)}
          </Text>
        </Pressable>
      ))}

      <View
        style={[
          styles.frontFolder,
          border,
          { backgroundColor: colors.folderOpen },
          offsetShadow(colors, 6),
        ]}
      >
        {children}
      </View>
      <View
        accessible
        accessibilityRole="tab"
        accessibilityLabel={activeTab.label}
        accessibilityState={{ selected: true }}
        aria-selected
        style={[
          styles.tab,
          styles.frontTab,
          compact,
          border,
          {
            width: layout.frontWidth as `${number}%`,
            backgroundColor: colors.folderOpen,
            borderBottomColor: colors.folderOpen,
          },
        ]}
      >
        <View style={[styles.dot, border, { backgroundColor: colors.accent }]} />
        <Text numberOfLines={1} style={[styles.tabText, styles.activeText, { color: colors.ink }]}>
          {desktop ? activeTab.label : (activeTab.shortLabel ?? activeTab.label)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', marginTop: 56, marginRight: 6 },
  backFolder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 14,
    borderWidth: 2,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  frontFolder: {
    marginTop: 14,
    borderWidth: 2,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    paddingHorizontal: 26,
    paddingTop: 34,
    paddingBottom: 28,
  },
  tab: {
    position: 'absolute',
    height: TAB_HEIGHT,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 2,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  backTab: { borderBottomWidth: 0 },
  frontTab: { top: -20, left: 0, zIndex: 2 },
  compact: { paddingHorizontal: 8, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, borderWidth: 1.5 },
  tabText: { fontFamily: fonts.mono, fontSize: 12, flexShrink: 1 },
  activeText: { fontFamily: fonts.monoMedium },
});

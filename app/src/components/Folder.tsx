import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts, offsetShadow, useColors } from '../theme';

type Props = {
  /** Pestaña de la carpeta abierta (delante, en color, con punto rosa). */
  activeLabel: string;
  /** Pestaña de la carpeta de detrás (kraft). */
  backLabel: string;
  onBackPress?: () => void;
  backDisabled?: boolean;
  children: ReactNode;
};

/**
 * Dos carpetas apiladas: la de detrás en kraft y la abierta delante, en color,
 * con su pestaña fundida con la carpeta y sombra sólida de 6 px.
 */
export function Folder({ activeLabel, backLabel, onBackPress, backDisabled, children }: Props) {
  const colors = useColors();
  const border = { borderColor: colors.ink };

  return (
    <View style={styles.container}>
      <View style={[styles.backFolder, border, { backgroundColor: colors.kraft }]} />
      <Pressable
        accessibilityRole="tab"
        accessibilityLabel={backLabel}
        accessibilityState={{ selected: false, disabled: backDisabled }}
        disabled={backDisabled}
        onPress={onBackPress}
        style={[styles.tab, styles.backTab, border, { backgroundColor: colors.kraft }]}
      >
        <Text style={[styles.tabText, { color: colors.ink }]}>{backLabel}</Text>
      </Pressable>

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
        accessibilityRole="tab"
        accessibilityState={{ selected: true }}
        style={[
          styles.tab,
          styles.frontTab,
          border,
          { backgroundColor: colors.folderOpen, borderBottomColor: colors.folderOpen },
        ]}
      >
        <View style={[styles.dot, border, { backgroundColor: colors.accent }]} />
        <Text style={[styles.tabText, styles.activeText, { color: colors.ink }]}>
          {activeLabel}
        </Text>
      </View>
    </View>
  );
}

const TAB_HEIGHT = 36;

const styles = StyleSheet.create({
  container: { position: 'relative', marginTop: 40, marginRight: 6 },
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
    paddingHorizontal: 28,
    paddingTop: 36,
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
  backTab: { top: -34, left: '50%', width: '42%', borderBottomWidth: 0 },
  frontTab: { top: -20, left: 0, width: '46%', zIndex: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, borderWidth: 1.5 },
  tabText: { fontFamily: fonts.mono, fontSize: 12 },
  activeText: { fontFamily: fonts.monoMedium },
});

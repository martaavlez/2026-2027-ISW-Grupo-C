import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Privacy } from '../services/api';
import { fonts, useColors } from '../theme';

// «tablero» es masculino: público, solo amigos, privado (diseño HertzTablero).
export const BOARD_PRIVACY_LABELS: Record<Privacy, string> = {
  public: 'PÚBLICO',
  friends: 'SOLO AMIGOS',
  private: 'PRIVADO',
};
const OPTIONS: Privacy[] = ['public', 'friends', 'private'];

/** Las tres opciones de privacidad en una fila; la elegida va en tinta. */
export function PrivacyPicker({
  value,
  onChange,
  label,
  disabled = false,
  fill = false,
}: {
  /** null: ninguna elegida todavía (se usará la de su configuración, RN-09). */
  value: Privacy | null;
  onChange: (privacy: Privacy) => void;
  /** Para los lectores de pantalla: «Privacidad del tablero». */
  label: string;
  disabled?: boolean;
  /** Ocupa todo el ancho (en los formularios, para que quepa en el móvil). */
  fill?: boolean;
}) {
  const colors = useColors();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={[styles.segmented, { borderColor: colors.ink }, fill ? styles.fill : null]}
    >
      {OPTIONS.map((option, index) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityLabel={BOARD_PRIVACY_LABELS[option]}
            accessibilityState={{ checked: selected, disabled }}
            aria-checked={selected}
            disabled={disabled}
            onPress={() => onChange(option)}
            style={[
              styles.segment,
              fill ? styles.segmentFill : null,
              index > 0 ? { borderLeftWidth: 2, borderLeftColor: colors.ink } : null,
              selected ? { backgroundColor: colors.ink } : null,
            ]}
          >
            <Text
              style={[
                styles.text,
                fill ? styles.textFill : null,
                { color: selected ? colors.background : colors.ink },
              ]}
            >
              {BOARD_PRIVACY_LABELS[option]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  segmented: { flexDirection: 'row', borderWidth: 2, alignSelf: 'flex-start' },
  fill: { alignSelf: 'stretch' },
  segment: { paddingVertical: 9, paddingHorizontal: 12 },
  segmentFill: { flex: 1, paddingHorizontal: 4, alignItems: 'center' },
  text: { fontFamily: fonts.mono, fontSize: 12 },
  textFill: { textAlign: 'center' },
});

import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { colors, fonts, spacing } from '../theme';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string;
  /** Campo de contraseña con botón para mostrarla u ocultarla. */
  password?: boolean;
};

/** Campo de formulario con su etiqueta y su mensaje de error. */
export function TextField({ label, error, password = false, ...inputProps }: Props) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <View
        style={[styles.box, focused ? styles.boxFocused : null, error ? styles.boxError : null]}
      >
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={password && !visible}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
          {...inputProps}
        />
        {password ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            onPress={() => setVisible(!visible)}
            hitSlop={8}
          >
            <Text style={styles.toggle}>{visible ? 'OCULTAR' : 'MOSTRAR'}</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm - 2 },
  label: { fontFamily: fonts.mono, fontSize: 12, letterSpacing: 1, color: colors.textMuted },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  boxFocused: { borderColor: colors.cyan },
  boxError: { borderColor: colors.pink, backgroundColor: colors.pinkSoft },
  input: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.text,
    paddingVertical: spacing.sm,
    outlineStyle: 'none',
  } as object,
  toggle: { fontFamily: fonts.monoMedium, fontSize: 12, letterSpacing: 1, color: colors.cyan },
  error: { fontFamily: fonts.body, fontSize: 13, color: colors.pink },
});

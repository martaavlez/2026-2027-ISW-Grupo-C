import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { fonts, spacing, useColors } from '../theme';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string;
  /** Campo de contraseña con botón para mostrarla u ocultarla. */
  password?: boolean;
};

/** Campo de formulario con su etiqueta en DM Mono y su mensaje de error. */
export function TextField({ label, error, password = false, ...inputProps }: Props) {
  const colors = useColors();
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.ink }]}>{label.toUpperCase()}</Text>
      <View
        style={[
          styles.box,
          { borderColor: error ? colors.accent : colors.ink, backgroundColor: colors.surface },
          error ? styles.boxError : null,
        ]}
      >
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.starEmpty}
          secureTextEntry={password && !visible}
          style={[styles.input, { color: colors.ink }]}
          {...inputProps}
        />
        {password ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            onPress={() => setVisible(!visible)}
            hitSlop={8}
          >
            <Text style={[styles.toggle, { color: colors.ink }]}>
              {visible ? 'OCULTAR' : 'MOSTRAR'}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={[styles.error, { color: colors.accentText }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm - 2, flex: 1, minWidth: 0 },
  label: { fontFamily: fonts.mono, fontSize: 12 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    paddingHorizontal: 12,
    borderWidth: 2,
  },
  boxError: { borderWidth: 3 },
  input: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    fontFamily: fonts.body,
    fontSize: 16,
    outlineStyle: 'none',
  } as object,
  toggle: { fontFamily: fonts.mono, fontSize: 11 },
  error: { fontFamily: fonts.body, fontSize: 13 },
});

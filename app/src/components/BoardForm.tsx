import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { FieldErrors, Privacy } from '../services/api';
import type { BoardItem } from '../services/boards-api';
import { fonts, useColors } from '../theme';
import { Button } from './Button';
import { PrivacyPicker } from './PrivacyPicker';
import { Thumb } from './SearchResultList';
import { TextField } from './TextField';

export const BOARD_NAME_MAX = 80;
export const BOARD_DESCRIPTION_MAX = 500;

export type BoardFormValues = {
  name: string;
  description: string;
  /** null al crear sin elegir: la API pone tu privacidad por defecto (RN-09). */
  privacy: Privacy | null;
  coverItemId: string | null;
};

type Props = {
  title: string;
  initial: BoardFormValues;
  submitLabel: string;
  saving: boolean;
  errors: FieldErrors;
  onSubmit: (values: BoardFormValues) => void;
  onCancel: () => void;
  /** Al editar: los elementos entre los que se elige la portada (PA-26-03). */
  coverItems?: BoardItem[];
  /** Al crear se elige la privacidad aquí; al editar, con el selector del tablero. */
  withPrivacy?: boolean;
};

/** HU-09 y HU-26 · Nombre, descripción y, según el caso, privacidad o portada. */
export function BoardForm({
  title,
  initial,
  submitLabel,
  saving,
  errors,
  onSubmit,
  onCancel,
  coverItems,
  withPrivacy = false,
}: Props) {
  const colors = useColors();
  const [values, setValues] = useState(initial);
  const [nameError, setNameError] = useState<string | undefined>();
  const ink = { color: colors.ink };
  const set = (changes: Partial<BoardFormValues>) =>
    setValues((current) => ({ ...current, ...changes }));

  function submit() {
    // RN-14: se avisa antes de enviar; la API lo vuelve a comprobar.
    if (!values.name.trim()) {
      setNameError('Ponle un nombre al tablero.');
      return;
    }
    setNameError(undefined);
    onSubmit(values);
  }

  return (
    <View style={[styles.panel, { borderColor: colors.ink, backgroundColor: colors.surface }]}>
      <Text accessibilityRole="header" style={[styles.title, ink]}>
        {title}
      </Text>
      <TextField
        label="Nombre"
        value={values.name}
        onChangeText={(name) => set({ name })}
        maxLength={BOARD_NAME_MAX}
        error={nameError ?? errors.name}
      />
      <TextField
        label="Descripción (opcional)"
        value={values.description}
        onChangeText={(description) => set({ description })}
        maxLength={BOARD_DESCRIPTION_MAX}
        multiline
        numberOfLines={3}
        error={errors.description}
      />
      <Text style={[styles.help, ink, styles.counter]}>
        {[...values.description].length}/{BOARD_DESCRIPTION_MAX}
      </Text>
      {withPrivacy ? (
        <View style={styles.group}>
          <Text style={[styles.help, ink]}>QUIÉN LO VE</Text>
          <PrivacyPicker
            label="Privacidad del tablero"
            fill
            value={values.privacy}
            onChange={(privacy) => set({ privacy })}
            disabled={saving}
          />
          {values.privacy === null ? (
            <Text style={[styles.note, ink]}>Si no eliges, se usa tu privacidad por defecto.</Text>
          ) : null}
          {errors.privacy ? (
            <Text style={[styles.error, { color: colors.accentText }]}>{errors.privacy}</Text>
          ) : null}
        </View>
      ) : null}
      {coverItems && coverItems.length > 0 ? (
        <View style={styles.group}>
          <Text style={[styles.help, ink]}>PORTADA</Text>
          <ScrollView horizontal contentContainerStyle={styles.covers}>
            <CoverOption
              label="Automática: la del primero"
              selected={values.coverItemId === null}
              onPress={() => set({ coverItemId: null })}
            >
              <View style={[styles.auto, { borderColor: colors.ink }]}>
                <Text style={[styles.autoText, ink]}>AUTO</Text>
              </View>
            </CoverOption>
            {coverItems.map((item) => (
              <CoverOption
                key={item.id}
                label={`Portada: ${item.title}`}
                selected={values.coverItemId === item.id}
                onPress={() => set({ coverItemId: item.id })}
              >
                <Thumb url={item.coverUrl} label={item.title} />
              </CoverOption>
            ))}
          </ScrollView>
          {errors.coverItemId ? (
            <Text style={[styles.error, { color: colors.accentText }]}>{errors.coverItemId}</Text>
          ) : null}
        </View>
      ) : null}
      {errors.form ? (
        <Text accessibilityRole="alert" style={[styles.error, { color: colors.accentText }]}>
          {errors.form}
        </Text>
      ) : null}
      <View style={[styles.row, styles.actions]}>
        <Button label="Cancelar" variant="secondary" disabled={saving} onPress={onCancel} />
        <Button label={submitLabel} variant="dark" loading={saving} onPress={submit} />
      </View>
    </View>
  );
}

function CoverOption({
  label,
  selected,
  onPress,
  children,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      aria-checked={selected}
      onPress={onPress}
      style={[styles.cover, { borderColor: selected ? colors.accent : 'transparent' }]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: { borderWidth: 2, padding: 18, gap: 12, maxWidth: 560, width: '100%' },
  title: { fontFamily: fonts.monoMedium, fontSize: 13 },
  group: { gap: 8 },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  actions: { justifyContent: 'flex-end' },
  help: { fontFamily: fonts.mono, fontSize: 12 },
  note: { fontFamily: fonts.body, fontSize: 14 },
  counter: { alignSelf: 'flex-end', marginTop: -6 },
  error: { fontFamily: fonts.body, fontSize: 14 },
  covers: { gap: 8, paddingVertical: 2 },
  cover: { borderWidth: 3, padding: 2 },
  auto: { width: 48, height: 48, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  autoText: { fontFamily: fonts.mono, fontSize: 10 },
});

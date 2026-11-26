import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { FieldErrors, Privacy } from '../services/api';
import { fonts, useColors } from '../theme';
import { Button } from './Button';

export const MAX_REVIEW_LENGTH = 2000;

const PRIVACY_OPTIONS: { value: Privacy; label: string }[] = [
  { value: 'public', label: 'PÚBLICO' },
  { value: 'friends', label: 'SOLO AMIGOS' },
  { value: 'private', label: 'PRIVADO' },
];

export const PRIVACY_LABELS: Record<Privacy, string> = {
  public: 'Pública',
  friends: 'Solo amigos',
  private: 'Privada',
};

type Props = {
  placeholder: string;
  defaultPrivacy: Privacy;
  publishing: boolean;
  errors: FieldErrors;
  onPublish: (body: string, privacy: Privacy) => void;
  /** Se llama al escribir, para quitar los avisos del intento anterior. */
  onEdit?: () => void;
};

/** HU-23 · Texto de la reseña, quién la ve y «Publicar reseña» (diseño de la ficha). */
export function ReviewComposer({
  placeholder,
  defaultPrivacy,
  publishing,
  errors,
  onPublish,
  onEdit,
}: Props) {
  const colors = useColors();
  const [body, setBody] = useState('');
  // PA-23-02: si no se cambia, se queda el nivel por defecto del usuario.
  const [privacy, setPrivacy] = useState<Privacy>(defaultPrivacy);
  const ink = { color: colors.ink };

  return (
    <View style={styles.composer}>
      <Text style={[styles.label, ink]}>ESCRIBE TU RESEÑA (OPCIONAL)</Text>
      <TextInput
        accessibilityLabel="Tu reseña"
        multiline
        numberOfLines={3}
        maxLength={MAX_REVIEW_LENGTH}
        placeholder={placeholder}
        placeholderTextColor={colors.starEmpty}
        value={body}
        onChangeText={(text) => {
          setBody(text);
          onEdit?.();
        }}
        style={[
          styles.input,
          {
            color: colors.ink,
            borderColor: errors.body ? colors.accent : colors.ink,
            backgroundColor: colors.background,
          },
        ]}
      />
      <View style={styles.meta}>
        {errors.body ? (
          <Text accessibilityRole="alert" style={[styles.error, { color: colors.accentText }]}>
            {errors.body}
          </Text>
        ) : (
          <View />
        )}
        <Text style={[styles.counter, ink]}>
          {body.length}/{MAX_REVIEW_LENGTH}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={[styles.label, ink]}>QUIÉN LA VE</Text>
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="Privacidad de la reseña"
          style={[styles.segmented, { borderColor: colors.ink }]}
        >
          {PRIVACY_OPTIONS.map((option, index) => {
            const selected = option.value === privacy;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityLabel={option.label}
                accessibilityState={{ checked: selected }}
                aria-checked={selected}
                onPress={() => setPrivacy(option.value)}
                style={[
                  styles.segment,
                  index > 0 ? { borderLeftWidth: 2, borderLeftColor: colors.ink } : null,
                  selected ? { backgroundColor: colors.ink } : null,
                ]}
              >
                <Text
                  style={[styles.segmentText, { color: selected ? colors.background : colors.ink }]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.publish}>
          <Button
            label="Publicar reseña"
            loading={publishing}
            onPress={() => onPublish(body, privacy)}
          />
        </View>
      </View>
      {errors.rating || errors.privacy || errors.general ? (
        <Text accessibilityRole="alert" style={[styles.error, { color: colors.accentText }]}>
          {errors.rating ?? errors.privacy ?? errors.general}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  composer: { gap: 8, marginTop: 6 },
  label: { fontFamily: fonts.mono, fontSize: 12 },
  input: {
    minHeight: 84,
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
    outlineStyle: 'none',
  } as object,
  meta: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  counter: { fontFamily: fonts.mono, fontSize: 11 },
  error: { fontFamily: fonts.body, fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 4 },
  segmented: { flexDirection: 'row', borderWidth: 2 },
  segment: { paddingVertical: 8, paddingHorizontal: 12 },
  segmentText: { fontFamily: fonts.mono, fontSize: 12 },
  publish: { marginLeft: 'auto' },
});

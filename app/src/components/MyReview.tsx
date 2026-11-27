import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { FieldErrors, Privacy } from '../services/api';
import { fonts, useColors } from '../theme';
import { Button } from './Button';
import { PRIVACY_LABELS, ReviewComposer } from './ReviewComposer';

type Props = {
  body: string;
  privacy: Privacy;
  placeholder: string;
  saving: boolean;
  errors: FieldErrors;
  removing: boolean;
  removeError: string | null;
  /** Devuelve true si se ha guardado, para volver a enseñar la reseña. */
  onSave: (body: string, privacy: Privacy) => Promise<boolean>;
  onRemove: () => void;
  onClearErrors: () => void;
};

/**
 * Tu reseña ya publicada, con quién la ve. Solo aquí salen «Editar» (HU-08) y «Eliminar»
 * (HU-47): en la lista de reseñas no hay opciones para las de los demás (PA-08-02).
 */
export function MyReview({
  body,
  privacy,
  placeholder,
  saving,
  errors,
  removing,
  removeError,
  onSave,
  onRemove,
  onClearErrors,
}: Props) {
  const colors = useColors();
  const [mode, setMode] = useState<'view' | 'edit' | 'remove'>('view');
  const ink = { color: colors.ink };

  function show(next: typeof mode) {
    onClearErrors();
    setMode(next);
  }

  if (mode === 'edit') {
    return (
      <ReviewComposer
        placeholder={placeholder}
        defaultPrivacy={privacy}
        initialBody={body}
        submitLabel="Guardar cambios"
        publishing={saving}
        errors={errors}
        onEdit={onClearErrors}
        onCancel={() => show('view')}
        onPublish={async (newBody, newPrivacy) => {
          if (await onSave(newBody, newPrivacy)) setMode('view');
        }}
      />
    );
  }

  return (
    <View style={styles.box}>
      <Text style={[styles.label, ink]}>TU RESEÑA · {PRIVACY_LABELS[privacy].toUpperCase()}</Text>
      <Text style={[styles.body, ink]}>{body}</Text>
      {mode === 'remove' ? (
        <View
          accessibilityRole="alert"
          style={[styles.confirm, { borderColor: colors.ink, backgroundColor: colors.surface }]}
        >
          <Text style={[styles.question, ink]}>
            ¿Eliminar tu reseña? También se borra tu valoración y deja de contar en la media. No se
            puede deshacer.
          </Text>
          <View style={styles.actions}>
            <Button
              label="Cancelar"
              variant="secondary"
              disabled={removing}
              onPress={() => show('view')}
            />
            <Button label="Sí, eliminar" variant="dark" loading={removing} onPress={onRemove} />
          </View>
        </View>
      ) : (
        <View style={styles.actions}>
          <Button label="Editar" variant="secondary" onPress={() => show('edit')} />
          <Button label="Eliminar" variant="secondary" onPress={() => show('remove')} />
        </View>
      )}
      {removeError ? (
        <Text accessibilityRole="alert" style={[styles.error, { color: colors.accentText }]}>
          {removeError}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 8, marginTop: 6 },
  label: { fontFamily: fonts.mono, fontSize: 12 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23 },
  actions: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 4 },
  confirm: { borderWidth: 2, padding: 14, gap: 10, marginTop: 4 },
  question: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  error: { fontFamily: fonts.body, fontSize: 13 },
});

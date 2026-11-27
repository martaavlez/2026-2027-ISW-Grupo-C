import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import type { FieldErrors } from '../services/api';
import { createBoard } from '../services/boards-api';
import { getSession } from '../services/session';
import { BoardForm } from './BoardForm';
import { Button } from './Button';

/**
 * HU-09 · «+ Nuevo tablero» en tu carpeta Tableros: nombre, descripción y privacidad.
 * Si no eliges privacidad, la API pone la tuya por defecto (PA-09-02, RN-09).
 * Al crearlo se abre el tablero.
 */
export function NewBoard({ onExpired }: { onExpired: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  if (!open) {
    return (
      <View style={{ alignSelf: 'flex-start' }}>
        <Button label="+ Nuevo tablero" variant="dark" onPress={() => setOpen(true)} />
      </View>
    );
  }

  return (
    <BoardForm
      title="NUEVO TABLERO"
      initial={{ name: '', description: '', privacy: null, coverItemId: null }}
      submitLabel="Crear tablero"
      withPrivacy
      saving={saving}
      errors={errors}
      onCancel={() => {
        setErrors({});
        setOpen(false);
      }}
      onSubmit={async ({ name, description, privacy }) => {
        const token = getSession()?.token;
        if (!token) {
          onExpired();
          return;
        }
        setSaving(true);
        setErrors({});
        const result = await createBoard(token, {
          name,
          description,
          ...(privacy ? { privacy } : {}),
        });
        setSaving(false);
        if (result.ok) {
          router.push(`/tablero/${result.data.id}`);
          return;
        }
        if (result.needsLogin) onExpired();
        else setErrors(result.errors);
      }}
    />
  );
}

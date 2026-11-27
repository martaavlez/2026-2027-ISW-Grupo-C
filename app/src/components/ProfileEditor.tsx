import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { pickPhoto } from '../features/profile/pickPhoto';
import { removeMyPhoto, updateMyProfile, uploadMyPhoto, type FieldErrors } from '../services/api';
import { fonts, useColors } from '../theme';
import { Button } from './Button';
import { TextField } from './TextField';
import { UserPhoto } from './UserPhoto';

const BIO_MAX = 300;

type Photo = { kind: 'keep' } | { kind: 'new'; blob: Blob; preview: string } | { kind: 'remove' };

type Props = {
  user: { name: string; bio: string | null; photoUrl: string | null };
  token: string;
  /** Se ha guardado: con el nombre nuevo, para la barra de arriba. */
  onSaved: (name: string) => void;
  onCancel: () => void;
  onExpired: () => void;
};

/** HU-45 · Editar mi perfil (PA-45-01): foto, nombre y biografía. */
export function ProfileEditor({ user, token, onSaved, onCancel, onExpired }: Props) {
  const colors = useColors();
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio ?? '');
  const [photo, setPhoto] = useState<Photo>({ kind: 'keep' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const ink = { color: colors.ink };

  let shownPhoto = user.photoUrl;
  if (photo.kind === 'new') shownPhoto = photo.preview;
  if (photo.kind === 'remove') shownPhoto = null;

  async function choosePhoto() {
    const picked = await pickPhoto();
    if (!picked) return;
    if (picked.ok) {
      setPhoto({ kind: 'new', blob: picked.blob, preview: picked.preview });
      setErrors((current) => ({ ...current, photo: undefined }));
    } else setErrors((current) => ({ ...current, photo: picked.error }));
  }

  async function save() {
    // Se avisa antes de enviar; la API lo vuelve a comprobar.
    if (!name.trim()) {
      setErrors({ name: 'Escribe tu nombre.' });
      return;
    }
    setSaving(true);
    setErrors({});
    const steps = [
      photo.kind === 'new' ? () => uploadMyPhoto(token, photo.blob) : null,
      photo.kind === 'remove' ? () => removeMyPhoto(token) : null,
      () => updateMyProfile(token, { name, bio }),
    ];
    for (const step of steps) {
      if (!step) continue;
      const result = await step();
      if (!result.ok) {
        setSaving(false);
        if (result.needsLogin) onExpired();
        else setErrors(result.errors);
        return;
      }
    }
    setSaving(false);
    onSaved(name.trim());
  }

  return (
    <View style={[styles.panel, { borderColor: colors.ink, backgroundColor: colors.surface }]}>
      <Text accessibilityRole="header" style={[styles.title, ink]}>
        EDITAR MI PERFIL
      </Text>
      <View style={styles.photoRow}>
        <UserPhoto url={shownPhoto} name={name || user.name} size={72} />
        <View style={styles.row}>
          <Button
            label="Cambiar foto"
            variant="secondary"
            disabled={saving}
            onPress={choosePhoto}
          />
          {shownPhoto ? (
            <Button
              label="Quitar foto"
              variant="secondary"
              disabled={saving}
              onPress={() => setPhoto({ kind: 'remove' })}
            />
          ) : null}
        </View>
      </View>
      <Text style={[styles.help, ink]}>JPEG, PNG o WebP, de 1 MB como máximo.</Text>
      {errors.photo ? (
        <Text accessibilityRole="alert" style={[styles.error, { color: colors.accentText }]}>
          {errors.photo}
        </Text>
      ) : null}
      <TextField
        label="Nombre"
        value={name}
        onChangeText={setName}
        maxLength={50}
        error={errors.name}
        autoComplete="name"
      />
      <TextField
        label="Biografía"
        value={bio}
        onChangeText={setBio}
        maxLength={BIO_MAX}
        multiline
        numberOfLines={3}
        error={errors.bio}
      />
      <Text style={[styles.help, ink, styles.counter]}>
        {[...bio].length}/{BIO_MAX}
      </Text>
      {errors.form ? (
        <Text accessibilityRole="alert" style={[styles.error, { color: colors.accentText }]}>
          {errors.form}
        </Text>
      ) : null}
      <View style={[styles.row, styles.actions]}>
        <Button label="Cancelar" variant="secondary" disabled={saving} onPress={onCancel} />
        <Button label="Guardar cambios" loading={saving} onPress={save} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { borderWidth: 2, padding: 18, gap: 12, marginTop: 8, maxWidth: 560, width: '100%' },
  title: { fontFamily: fonts.monoMedium, fontSize: 13 },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  actions: { justifyContent: 'flex-end' },
  help: { fontFamily: fonts.mono, fontSize: 12 },
  counter: { alignSelf: 'flex-end', marginTop: -6 },
  error: { fontFamily: fonts.body, fontSize: 14 },
});

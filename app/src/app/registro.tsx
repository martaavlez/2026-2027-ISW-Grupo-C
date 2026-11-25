// HertzRegistro · Crear cuenta (HU-01 · PA-01-01 a 03).
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Button } from '../components/Button';
import { Checkbox } from '../components/Checkbox';
import { EntryLayout } from '../components/EntryLayout';
import { Folder } from '../components/Folder';
import { TextField } from '../components/TextField';
import {
  checkPasswordRequirements,
  PASSWORD_REQUIREMENTS,
  validateRegistrationForm,
} from '../features/auth/registration-rules';
import { FieldErrors, registerUser, RegistrationForm } from '../services/api';
import { saveSession } from '../services/session';
import { DESKTOP_MIN_WIDTH, fonts, spacing, useColors } from '../theme';

const EMPTY_FORM: RegistrationForm = {
  name: '',
  username: '',
  email: '',
  password: '',
  acceptedTerms: false,
};

export default function RegisterScreen() {
  const router = useRouter();
  const colors = useColors();
  const { width } = useWindowDimensions();
  const twoColumns = width >= DESKTOP_MIN_WIDTH;
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const requirements = checkPasswordRequirements(form.password);

  function update<K extends keyof RegistrationForm>(field: K, value: RegistrationForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, general: undefined }));
  }

  async function submit() {
    const formErrors = validateRegistrationForm(form);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setSubmitting(true);
    const result = await registerUser(form);
    setSubmitting(false);

    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    // PA-01-01: la cuenta queda creada y con la sesión iniciada.
    saveSession(result.session);
    router.replace('/inicio');
  }

  return (
    <EntryLayout>
      {/* «Iniciar sesión» se activa con la HU-02. */}
      <Folder activeLabel="CREAR CUENTA" backLabel="INICIAR SESIÓN" backDisabled>
        <View style={styles.form}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>
            EMPIEZA TU COLECCIÓN
          </Text>

          <View style={twoColumns ? styles.row : styles.column}>
            <TextField
              label="Nombre"
              placeholder="Lucía"
              value={form.name}
              onChangeText={(value) => update('name', value)}
              error={errors.name}
              autoComplete="name"
            />
            <TextField
              label="Nombre de usuario"
              placeholder="lucia"
              value={form.username}
              onChangeText={(value) => update('username', value)}
              error={errors.username}
              autoCapitalize="none"
              autoComplete="username"
            />
          </View>
          <TextField
            label="Correo electrónico"
            placeholder="tu@correo.com"
            value={form.email}
            onChangeText={(value) => update('email', value)}
            error={errors.email}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
          />
          <TextField
            label="Contraseña"
            placeholder="••••••••"
            value={form.password}
            onChangeText={(value) => update('password', value)}
            error={errors.password}
            autoComplete="new-password"
            password
          />

          {/* PA-01-03: qué requisitos cumple la contraseña y cuáles faltan. */}
          <View accessibilityLabel="Requisitos de la contraseña" style={styles.requirements}>
            {PASSWORD_REQUIREMENTS.map(({ key, label }) => (
              <Text
                key={key}
                style={[
                  styles.requirement,
                  { color: requirements[key] ? colors.ink : colors.accentText },
                ]}
              >
                {requirements[key] ? '✓' : '✗'} {label.toUpperCase()}
              </Text>
            ))}
          </View>

          <Checkbox
            label="Acepto los términos y la política de privacidad."
            checked={form.acceptedTerms}
            onChange={(value) => update('acceptedTerms', value)}
            error={errors.acceptedTerms}
          />

          {errors.general ? (
            <Text accessibilityRole="alert" style={[styles.general, { color: colors.accentText }]}>
              {errors.general}
            </Text>
          ) : null}

          <Button label="Crear mi cuenta" onPress={submit} loading={submitting} />

          <Text style={[styles.note, { color: colors.ink }]}>
            TODO LO QUE PUBLIQUES SERÁ PÚBLICO HASTA QUE LO CAMBIES EN AJUSTES
          </Text>
        </View>
      </Folder>
    </EntryLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  title: { fontFamily: fonts.display, fontSize: 52, lineHeight: 47, marginBottom: spacing.xs },
  row: { flexDirection: 'row', gap: 14 },
  column: { gap: spacing.md },
  requirements: { gap: 2, marginTop: -6 },
  requirement: { fontFamily: fonts.mono, fontSize: 11 },
  general: { fontFamily: fonts.body, fontSize: 14, textAlign: 'center' },
  note: { fontFamily: fonts.mono, fontSize: 11, textAlign: 'center' },
});

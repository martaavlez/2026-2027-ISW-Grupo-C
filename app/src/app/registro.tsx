// A02 · Registro y A03 · Registro con errores (HU-01 · PA-01-01 a 03).
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { Checkbox } from '../components/Checkbox';
import { Logo } from '../components/Logo';
import { Screen } from '../components/Screen';
import { TextField } from '../components/TextField';
import {
  checkPasswordRequirements,
  PASSWORD_REQUIREMENTS,
  validateRegistrationForm,
} from '../features/auth/registration-rules';
import { FieldErrors, registerUser, RegistrationForm } from '../services/api';
import { saveSession } from '../services/session';
import { colors, fonts, spacing } from '../theme';

const EMPTY_FORM: RegistrationForm = {
  name: '',
  username: '',
  email: '',
  password: '',
  acceptedTerms: false,
};

export default function RegisterScreen() {
  const router = useRouter();
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
    <Screen>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={() => router.back()}
          style={styles.back}
        >
          <Text style={styles.backText}>{'<'}</Text>
        </Pressable>
        <Logo />
        <View style={styles.headerSpacer} />
      </View>

      <Text accessibilityRole="header" style={styles.title}>
        Crear cuenta
      </Text>

      <View style={styles.form}>
        <TextField
          label="Nombre"
          value={form.name}
          onChangeText={(value) => update('name', value)}
          error={errors.name}
          autoComplete="name"
        />
        <TextField
          label="Nombre de usuario"
          value={form.username}
          onChangeText={(value) => update('username', value)}
          error={errors.username}
          autoCapitalize="none"
          autoComplete="username"
        />
        <TextField
          label="Correo electrónico"
          value={form.email}
          onChangeText={(value) => update('email', value)}
          error={errors.email}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
        />
        <TextField
          label="Contraseña"
          value={form.password}
          onChangeText={(value) => update('password', value)}
          error={errors.password}
          autoComplete="new-password"
          password
        />

        {/* PA-01-03: qué requisitos cumple la contraseña y cuáles faltan. */}
        <View accessibilityLabel="Requisitos de la contraseña" style={styles.requirements}>
          {PASSWORD_REQUIREMENTS.map(({ key, label }) => (
            <Text key={key} style={requirements[key] ? styles.met : styles.unmet}>
              {requirements[key] ? '✓' : '✗'} {label}
            </Text>
          ))}
        </View>

        <Checkbox
          label="Acepto las condiciones de uso y la política de privacidad"
          checked={form.acceptedTerms}
          onChange={(value) => update('acceptedTerms', value)}
          error={errors.acceptedTerms}
        />
      </View>

      {errors.general ? (
        <Text accessibilityRole="alert" style={styles.general}>
          {errors.general}
        </Text>
      ) : null}

      <Button label="Crear cuenta" onPress={submit} loading={submitting} />

      <Text style={styles.footer}>
        ¿Ya tienes cuenta? <Text style={styles.link}>Inicia sesión</Text>
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: {
    width: 44,
    height: 44,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontFamily: fonts.logo, fontSize: 18, color: colors.text },
  headerSpacer: { width: 44 },
  title: { fontFamily: fonts.heading, fontSize: 28, lineHeight: 30, color: colors.text },
  form: { gap: spacing.md + 2 },
  requirements: { gap: spacing.xs },
  met: { fontFamily: fonts.mono, fontSize: 13, color: colors.cyan },
  unmet: { fontFamily: fonts.mono, fontSize: 13, color: colors.pink },
  general: { fontFamily: fonts.body, fontSize: 14, color: colors.pink, textAlign: 'center' },
  footer: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  link: { fontFamily: fonts.bodyBold, color: colors.cyan },
});

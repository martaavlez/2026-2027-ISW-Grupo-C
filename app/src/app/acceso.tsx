// HertzAcceso · Iniciar sesión (HU-02 · PA-02-01 a 04).
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { EntryLayout } from '../components/EntryLayout';
import { Folder } from '../components/Folder';
import { TextField } from '../components/TextField';
import type { FieldErrors } from '../services/api';
import { loginUser, type LoginForm } from '../services/auth-api';
import { saveSession } from '../services/session';
import { fonts, spacing, useColors } from '../theme';

/**
 * Avisos al llegar aquí porque la sesión guardada ya no vale (PA-02-04), la cuenta se suspendió
 * o se ha cerrado la sesión (HU-17).
 */
const NOTICES: Record<string, string> = {
  cerrada: 'Has cerrado sesión. Puedes seguir como visitante o volver a entrar.',
  caducada: 'Tu sesión ha caducado. Inicia sesión de nuevo.',
  suspendida: 'Tu cuenta está suspendida y se ha cerrado la sesión.',
};

function validate(form: LoginForm): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.login.trim()) errors.login = 'Escribe tu correo o tu nombre de usuario.';
  if (!form.password) errors.password = 'Escribe tu contraseña.';
  return errors;
}

export default function LoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const { aviso } = useLocalSearchParams<{ aviso?: string }>();
  const notice = typeof aviso === 'string' ? NOTICES[aviso] : undefined;
  const [form, setForm] = useState<LoginForm>({ login: '', password: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function update(field: keyof LoginForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, general: undefined }));
  }

  async function submit() {
    const formErrors = validate(form);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    setSubmitting(true);
    const result = await loginUser({ login: form.login.trim(), password: form.password });
    setSubmitting(false);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    // PA-02-01: accede a su cuenta.
    saveSession(result.session);
    router.replace('/inicio');
  }

  return (
    <EntryLayout>
      <Folder
        activeLabel="INICIAR SESIÓN"
        backLabel="CREAR CUENTA"
        onBackPress={() => router.replace('/registro')}
      >
        <View style={styles.form}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>
            HOLA DE NUEVO
          </Text>

          {notice && !errors.general ? (
            <Text accessibilityRole="alert" style={[styles.general, { color: colors.accentText }]}>
              {notice}
            </Text>
          ) : null}

          <TextField
            label="Correo o nombre de usuario"
            placeholder="lucia o tu@correo.com"
            value={form.login}
            onChangeText={(value) => update('login', value)}
            error={errors.login}
            autoCapitalize="none"
            autoComplete="username"
            maxLength={100}
          />
          <TextField
            label="Contraseña"
            placeholder="••••••••"
            value={form.password}
            onChangeText={(value) => update('password', value)}
            onSubmitEditing={submit}
            error={errors.password}
            autoComplete="current-password"
            password
          />

          {/* PA-02-02 y PA-02-03: credenciales incorrectas o cuenta suspendida. */}
          {errors.general ? (
            <Text accessibilityRole="alert" style={[styles.general, { color: colors.accentText }]}>
              {errors.general}
            </Text>
          ) : null}

          <Button label="Entrar" onPress={submit} loading={submitting} />

          <Text style={[styles.signUp, { color: colors.ink }]}>
            ¿Aún no tienes cuenta?{' '}
            <Link href="/registro" style={[styles.link, { color: colors.accentText }]}>
              Créala aquí
            </Link>
          </Text>
        </View>
      </Folder>
    </EntryLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  title: { fontFamily: fonts.display, fontSize: 52, lineHeight: 47, marginBottom: spacing.xs },
  general: { fontFamily: fonts.body, fontSize: 14, textAlign: 'center' },
  signUp: { fontFamily: fonts.body, fontSize: 14, textAlign: 'center' },
  link: { fontFamily: fonts.bodyBold, textDecorationLine: 'underline' },
});

// HU-02 · Iniciar sesión y comprobar la sesión guardada.
import { API_URL, CONNECTION_ERROR, type FieldErrors, type Session, type User } from './api';

export type LoginForm = { login: string; password: string };

export type LoginResult =
  { ok: true; session: Session } | { ok: false; errors: FieldErrors; suspended?: boolean };

/** Entra con correo o nombre de usuario. Si algo falla, devuelve el mensaje que hay que mostrar. */
export async function loginUser(
  form: LoginForm,
  fetchFn: typeof fetch = fetch,
): Promise<LoginResult> {
  try {
    const response = await fetchFn(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const body = await response.json();
    if (response.ok) return { ok: true, session: body as Session };
    if (response.status === 400 && body.errors) return { ok: false, errors: body.errors };
    return {
      ok: false,
      errors: { general: body.error ?? CONNECTION_ERROR },
      suspended: response.status === 403,
    };
  } catch {
    return { ok: false, errors: { general: CONNECTION_ERROR } };
  }
}

export type SessionCheck =
  | { status: 'valid'; user: User }
  | { status: 'invalid' }
  | { status: 'suspended'; message: string }
  | { status: 'offline' };

/**
 * PA-02-04: pregunta al servidor si el token guardado sigue valiendo. Si no se puede conectar,
 * no se cierra la sesión (puede ser un corte momentáneo); el servidor rechazará igualmente
 * cualquier petición con un token caducado o manipulado.
 */
export async function checkSession(
  token: string,
  fetchFn: typeof fetch = fetch,
): Promise<SessionCheck> {
  try {
    const response = await fetchFn(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok)
      return { status: 'valid', user: ((await response.json()) as { user: User }).user };
    if (response.status === 401) return { status: 'invalid' };
    if (response.status === 403) {
      const body = (await response.json()) as { error?: string };
      return { status: 'suspended', message: body.error ?? 'Tu cuenta está suspendida.' };
    }
    return { status: 'offline' };
  } catch {
    return { status: 'offline' };
  }
}

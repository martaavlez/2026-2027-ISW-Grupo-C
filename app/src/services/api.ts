// Llamadas a la API de Hertz.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export type User = { id: number; name: string; username: string; email: string; role: string };
export type Session = { token: string; user: User };
export type FieldErrors = Partial<Record<string, string>>;
export type PasswordRequirements = { minLength: boolean; letter: boolean; number: boolean };

export type RegistrationForm = {
  name: string;
  username: string;
  email: string;
  password: string;
  acceptedTerms: boolean;
};

export type RegisterResult =
  | { ok: true; session: Session }
  | { ok: false; errors: FieldErrors; passwordRequirements?: PasswordRequirements };

const CONNECTION_ERROR = 'No se ha podido conectar con Hertz. Inténtalo de nuevo en un momento.';

/** HU-01 · Crea la cuenta. Si algo falla, devuelve los mensajes de cada campo. */
export async function registerUser(
  form: RegistrationForm,
  fetchFn: typeof fetch = fetch,
): Promise<RegisterResult> {
  try {
    const response = await fetchFn(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const body = await response.json();
    if (response.ok) return { ok: true, session: body };
    return {
      ok: false,
      errors: body.errors ?? { general: CONNECTION_ERROR },
      passwordRequirements: body.passwordRequirements,
    };
  } catch {
    return { ok: false, errors: { general: CONNECTION_ERROR } };
  }
}

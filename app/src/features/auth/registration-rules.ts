// Mismas reglas que comprueba la API (api/src/auth/registration-rules.js), para avisar
// antes de enviar. La API las vuelve a comprobar siempre (RNF-02).
import type { FieldErrors, PasswordRequirements, RegistrationForm } from '../../services/api';

const PASSWORD_MAX_BYTES = 72;
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/;
const USERNAME_PATTERN = /^[A-Za-z0-9._]{3,30}$/;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const PASSWORD_REQUIREMENTS: { key: keyof PasswordRequirements; label: string }[] = [
  { key: 'minLength', label: 'Mínimo 8 caracteres' },
  { key: 'letter', label: 'Al menos una letra' },
  { key: 'number', label: 'Al menos un número' },
];

export function checkPasswordRequirements(password: string): PasswordRequirements {
  return {
    minLength: password.length >= 8,
    letter: /\p{L}/u.test(password),
    number: /\d/.test(password),
  };
}

export function validateRegistrationForm(form: RegistrationForm): FieldErrors {
  const errors: FieldErrors = {};
  const name = form.name.trim();
  const email = form.email.trim();

  if (!name) errors.name = 'Escribe tu nombre.';
  else if (name.length > 50) errors.name = 'El nombre puede tener como máximo 50 caracteres.';
  else if (CONTROL_CHARACTERS.test(name)) errors.name = 'El nombre tiene caracteres no válidos.';

  if (!USERNAME_PATTERN.test(form.username.trim())) {
    errors.username = 'Entre 3 y 30 caracteres: letras, números, puntos o guiones bajos.';
  }
  if (!EMAIL_PATTERN.test(email) || email.length > 100) {
    errors.email = 'Escribe un correo electrónico válido.';
  }
  if (!Object.values(checkPasswordRequirements(form.password)).every(Boolean)) {
    errors.password = 'La contraseña no cumple los requisitos.';
  } else if (new TextEncoder().encode(form.password).length > PASSWORD_MAX_BYTES) {
    errors.password = 'La contraseña puede tener como máximo 72 caracteres.';
  }
  if (!form.acceptedTerms) {
    errors.acceptedTerms = 'Tienes que aceptar las condiciones de uso y la política de privacidad.';
  }
  return errors;
}

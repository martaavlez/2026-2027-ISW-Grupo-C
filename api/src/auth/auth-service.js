// Casos de uso de la autenticación. HU-01 · Registrarse.
const { ConflictError, ValidationError } = require('../errors');
const { hashPassword } = require('./password');
const {
  checkPasswordRequirements,
  normalizeRegistration,
  validateRegistration,
} = require('./registration-rules');
const { createSessionToken } = require('./token');

const UNIQUE_VIOLATION = '23505';

const TAKEN_MESSAGES = {
  username: 'Este nombre de usuario ya está en uso. Prueba con otro.',
  email: 'Este correo ya está registrado. ¿Quieres iniciar sesión?',
};

function takenErrors(taken) {
  const errors = {};
  if (taken.username) errors.username = TAKEN_MESSAGES.username;
  if (taken.email) errors.email = TAKEN_MESSAGES.email;
  return errors;
}

function createAuthService({ users, tokenOptions }) {
  async function register(body) {
    const data = normalizeRegistration(body);

    // PA-01-03: si la contraseña no es segura, se dice qué requisitos faltan.
    const errors = validateRegistration(data);
    if (Object.keys(errors).length > 0) {
      const error = new ValidationError(errors);
      error.passwordRequirements = checkPasswordRequirements(data.password);
      throw error;
    }

    // PA-01-02 · RN-01: ni el nombre de usuario ni el correo pueden repetirse.
    const conflicts = takenErrors(await users.findTakenFields(data));
    if (Object.keys(conflicts).length > 0) throw new ConflictError(conflicts);

    try {
      const passwordHash = await hashPassword(data.password);
      const user = await users.createWithDefaultPrivacy({ ...data, passwordHash });
      // PA-01-01: la cuenta queda creada y con la sesión iniciada.
      return { user, token: createSessionToken(user, tokenOptions) };
    } catch (error) {
      // Dos registros a la vez con los mismos datos: la base de datos frena al segundo.
      if (error.code === UNIQUE_VIOLATION) {
        const field = error.constraint?.includes('email') ? 'email' : 'username';
        throw new ConflictError({ [field]: TAKEN_MESSAGES[field] });
      }
      throw error;
    }
  }

  return { register };
}

module.exports = { createAuthService, TAKEN_MESSAGES };

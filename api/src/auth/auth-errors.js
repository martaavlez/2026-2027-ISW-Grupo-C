// Errores propios del inicio de sesión (HU-02). Van aparte de errors.js para que cada HU
// añada los suyos sin pisarse.
const { ApiError } = require('../errors');

/** 401: credenciales incorrectas o sesión no válida. */
class UnauthorizedError extends ApiError {
  constructor(message) {
    super(401, message);
  }
}

/** 403: la cuenta existe y la contraseña es correcta, pero está suspendida (RN-02). */
class SuspendedAccountError extends ApiError {
  constructor(reason) {
    super(
      403,
      reason ? `Tu cuenta está suspendida. Motivo: ${reason}` : 'Tu cuenta está suspendida.',
    );
  }
}

module.exports = { UnauthorizedError, SuspendedAccountError };

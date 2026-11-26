// Errores propios de la API: son los únicos cuyo mensaje se enseña al cliente.

class ApiError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.errors = errors;
  }
}

class ValidationError extends ApiError {
  constructor(errors) {
    super(400, 'Los datos no son válidos', errors);
  }
}

class ConflictError extends ApiError {
  constructor(errors) {
    super(409, 'Los datos ya existen', errors);
  }
}

class NotFoundError extends ApiError {
  constructor(message = 'No existe') {
    super(404, message);
  }
}

module.exports = { ApiError, ValidationError, ConflictError, NotFoundError };

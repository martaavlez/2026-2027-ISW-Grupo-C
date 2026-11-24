const {
  checkPasswordRequirements,
  normalizeRegistration,
  validateRegistration,
} = require('../../src/auth/registration-rules');

const valid = {
  name: 'Lucía Moreno',
  username: 'lucia.m',
  email: 'lucia@correo.es',
  password: 'secreta123',
  acceptedTerms: true,
};

test('test_checkPasswordRequirements_withShortPasswordWithoutNumber_reportsEachRequirement', () => {
  expect(checkPasswordRequirements('abc')).toEqual({
    minLength: false,
    letter: true,
    number: false,
  });
  expect(checkPasswordRequirements('12345678')).toEqual({
    minLength: true,
    letter: false,
    number: true,
  });
  expect(checkPasswordRequirements('contraseña1')).toEqual({
    minLength: true,
    letter: true,
    number: true,
  });
  expect(checkPasswordRequirements()).toEqual({ minLength: false, letter: false, number: false });
});

test('test_normalizeRegistration_withSpacesAndCapitals_cleansData', () => {
  expect(
    normalizeRegistration({
      ...valid,
      name: '  Lucía ',
      email: ' Lucia@Correo.ES ',
      username: ' lucia.m ',
    }),
  ).toEqual({ ...valid, name: 'Lucía', email: 'lucia@correo.es' });
  expect(normalizeRegistration(undefined)).toEqual({
    name: '',
    username: '',
    email: '',
    password: '',
    acceptedTerms: false,
  });
});

test('test_validateRegistration_withValidData_returnsNoErrors', () => {
  expect(validateRegistration(valid)).toEqual({});
});

test('test_validateRegistration_withEmptyForm_returnsAMessagePerField', () => {
  const errors = validateRegistration(normalizeRegistration({}));

  expect(Object.keys(errors).sort()).toEqual([
    'acceptedTerms',
    'email',
    'name',
    'password',
    'username',
  ]);
});

test('test_validateRegistration_withInvalidFormats_rejectsThem', () => {
  const errors = validateRegistration({
    ...valid,
    name: 'n'.repeat(51),
    username: 'lu cía',
    email: 'sin-arroba',
  });

  expect(errors.name).toMatch('50 caracteres');
  expect(errors.username).toMatch('entre 3 y 30');
  expect(errors.email).toMatch('correo electrónico válido');
});

test('test_validateRegistration_withTooLongEmail_rejectsIt', () => {
  expect(validateRegistration({ ...valid, email: `${'a'.repeat(96)}@x.es` }).email).toBeDefined();
});

test('test_validateRegistration_withPasswordOver72Bytes_rejectsIt', () => {
  expect(validateRegistration({ ...valid, password: `a1${'x'.repeat(70)}` })).toEqual({});
  expect(validateRegistration({ ...valid, password: `a1${'x'.repeat(71)}` }).password).toMatch(
    '72 caracteres',
  );
  // Las letras con tilde ocupan 2 bytes: 36 «ñ» ya son 72 bytes.
  expect(validateRegistration({ ...valid, password: `1${'ñ'.repeat(36)}` }).password).toBeDefined();
});

test('test_normalizeRegistration_withTermsAsText_doesNotAcceptThem', () => {
  expect(normalizeRegistration({ acceptedTerms: 'true' }).acceptedTerms).toBe(false);
  expect(normalizeRegistration({ acceptedTerms: 1 }).acceptedTerms).toBe(false);
});

test('test_validateRegistration_withControlCharacterInName_rejectsIt', () => {
  expect(validateRegistration({ ...valid, name: 'admin\u0000' }).name).toMatch('no válidos');
  expect(validateRegistration({ ...valid, name: 'Lucía\nMoreno' }).name).toMatch('no válidos');
});

import {
  checkPasswordRequirements,
  validateRegistrationForm,
} from '../features/auth/registration-rules';

const valid = {
  name: 'Lucía Moreno',
  username: 'lucia.m',
  email: 'lucia@correo.es',
  password: 'secreta123',
  acceptedTerms: true,
};

test('test_checkPasswordRequirements_withDifferentPasswords_reportsEachRequirement', () => {
  expect(checkPasswordRequirements('abc123')).toEqual({
    minLength: false,
    letter: true,
    number: true,
  });
  expect(checkPasswordRequirements('solotexto')).toEqual({
    minLength: true,
    letter: true,
    number: false,
  });
});

test('test_validateRegistrationForm_withValidData_returnsNoErrors', () => {
  expect(validateRegistrationForm(valid)).toEqual({});
});

test('test_validateRegistrationForm_withWrongData_returnsAMessagePerField', () => {
  const errors = validateRegistrationForm({
    name: ' ',
    username: 'lu',
    email: 'lucia@',
    password: 'corta',
    acceptedTerms: false,
  });

  expect(Object.keys(errors).sort()).toEqual([
    'acceptedTerms',
    'email',
    'name',
    'password',
    'username',
  ]);
});

test('test_validateRegistrationForm_withTooLongName_rejectsIt', () => {
  expect(validateRegistrationForm({ ...valid, name: 'n'.repeat(51) }).name).toMatch('50');
});

test('test_validateRegistrationForm_withPasswordOver72Bytes_rejectsIt', () => {
  expect(validateRegistrationForm({ ...valid, password: `a1${'x'.repeat(71)}` }).password).toMatch(
    '72',
  );
});

test('test_validateRegistrationForm_withControlCharacterInName_rejectsIt', () => {
  expect(validateRegistrationForm({ ...valid, name: 'admin\u0000' }).name).toMatch('no válidos');
});

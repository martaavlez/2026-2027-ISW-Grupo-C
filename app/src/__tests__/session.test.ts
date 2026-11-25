import { clearSession, getSession, saveSession } from '../services/session';

const session = {
  token: 't',
  user: { id: 1, name: 'Lucía', username: 'lucia.m', email: 'l@c.es', role: 'user' },
};

afterEach(() => {
  clearSession();
  delete (globalThis as { localStorage?: Storage }).localStorage;
});

test('test_session_withoutLocalStorage_isKeptInMemory', () => {
  expect(getSession()).toBeNull();

  saveSession(session);
  expect(getSession()).toEqual(session);

  clearSession();
  expect(getSession()).toBeNull();
});

test('test_session_withLocalStorage_isSavedInTheBrowser', () => {
  const store = new Map<string, string>();
  (globalThis as { localStorage?: Partial<Storage> }).localStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => void store.set(key, value),
    removeItem: (key) => void store.delete(key),
  };

  saveSession(session);

  expect(JSON.parse(store.get('hertz.session') ?? '')).toEqual(session);
  expect(getSession()).toEqual(session);
  clearSession();
  expect(store.has('hertz.session')).toBe(false);
});

// Guarda la sesión (token JWT y usuario) en el navegador (RNF-11).
// En la web se usa localStorage; donde no existe (tests, Expo Go) se guarda en memoria.
import type { Session } from './api';

const KEY = 'repeat.session';
let memorySession: Session | null = null;

function storage(): Storage | null {
  return typeof globalThis.localStorage === 'undefined' ? null : globalThis.localStorage;
}

export function saveSession(session: Session): void {
  memorySession = session;
  storage()?.setItem(KEY, JSON.stringify(session));
}

export function getSession(): Session | null {
  const saved = storage()?.getItem(KEY);
  return saved ? (JSON.parse(saved) as Session) : memorySession;
}

export function clearSession(): void {
  memorySession = null;
  storage()?.removeItem(KEY);
}

import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { checkSession } from '../services/auth-api';
import { clearSession, getSession } from '../services/session';

/**
 * PA-02-04: al abrir la web se comprueba con el servidor la sesión guardada. Si el token ha
 * caducado o se ha manipulado, se borra y se pide iniciar sesión de nuevo.
 */
export function SessionCheck() {
  const router = useRouter();

  useEffect(() => {
    const token = getSession()?.token;
    if (!token) return;
    checkSession(token).then((result) => {
      if (result.status === 'invalid' || result.status === 'suspended') {
        clearSession();
        router.replace({
          pathname: '/acceso',
          params: { aviso: result.status === 'invalid' ? 'caducada' : 'suspendida' },
        });
      }
    });
  }, [router]);

  return null;
}

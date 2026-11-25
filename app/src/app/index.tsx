// Entrada de la web. La pantalla de iniciar sesión (HertzAcceso) llegará con la HU-02;
// mientras, quien no tiene sesión va directamente a crear cuenta.
import { Redirect } from 'expo-router';

import { getSession } from '../services/session';

export default function EntryScreen() {
  return <Redirect href={getSession() ? '/inicio' : '/registro'} />;
}

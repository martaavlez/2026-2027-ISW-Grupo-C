// Entrada de la web: con sesión, al inicio; sin sesión, a iniciar sesión (HertzAcceso).
import { Redirect } from 'expo-router';

import { getSession } from '../services/session';

export default function EntryScreen() {
  return <Redirect href={getSession() ? '/inicio' : '/acceso'} />;
}

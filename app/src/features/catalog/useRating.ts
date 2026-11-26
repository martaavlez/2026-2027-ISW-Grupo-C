// HU-05 · Guarda la nota al pulsar una estrella y actualiza la media de la ficha.
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { rateItem, type ItemKind, type RatingResult } from '../../services/api';
import { clearSession, getSession } from '../../services/session';

type Summary = Extract<RatingResult, { ok: true }>['data'];

export function useRating(
  kind: ItemKind,
  id: string,
  current: number | null,
  onSaved: (summary: Summary) => void,
) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Mientras se guarda se enseña ya la nueva nota; si falla, vuelve la anterior.
  const [optimistic, setOptimistic] = useState<number | null>(null);

  async function rate(rating: number) {
    const session = getSession();
    setSaving(true);
    setError(null);
    setOptimistic(rating);
    const result = await rateItem(kind, id, rating, session?.token);
    setSaving(false);
    setOptimistic(null);
    if (result.ok) {
      onSaved(result.data);
      return;
    }
    // Con sesión guardada, un 401 es que el token ya no vale (PA-02-04): se pide entrar de nuevo.
    if (result.needsLogin && session) {
      clearSession();
      router.replace({ pathname: '/acceso', params: { aviso: 'caducada' } });
      return;
    }
    setError(result.error);
  }

  return { value: optimistic ?? current, saving, error, rate };
}

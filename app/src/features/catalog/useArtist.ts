// Carga la ficha de un artista (HU-59). Igual que useCatalogItem, pero sin reseñas.
import { useCallback, useEffect, useState } from 'react';

import { getArtist, type Artist } from '../../services/api';
import { getSession } from '../../services/session';

type State =
  | { status: 'loading' }
  | { status: 'error'; notFound: boolean; error: string }
  | { status: 'ready'; artist: Artist };

export function useArtist(id: string) {
  const [stored, setStored] = useState<{ key: string; state: State } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const token = getSession()?.token;
  const key = `${id}|${attempt}|${token ?? ''}`;
  const state: State = stored?.key === key ? stored.state : { status: 'loading' };

  useEffect(() => {
    let active = true;
    getArtist(id, token).then((result) => {
      if (!active) return;
      setStored({
        key,
        state: result.ok
          ? { status: 'ready', artist: result.data }
          : { status: 'error', notFound: result.notFound, error: result.error },
      });
    });
    return () => {
      active = false;
    };
  }, [id, key, token]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return { state, retry };
}

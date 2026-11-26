// Lanza la búsqueda (HU-03) cada vez que cambia el término de la dirección (?q=…).
import { useEffect, useState } from 'react';

import { search, type SearchResults } from '../../services/api';
import { getSession } from '../../services/session';

export const MIN_SEARCH_LENGTH = 2;

type State =
  | { status: 'idle' }
  | { status: 'loading'; previous?: SearchResults }
  | { status: 'error'; error: string }
  | { status: 'ready'; results: SearchResults };

export function useSearch(term: string) {
  const [stored, setStored] = useState<{ key: string; state: State } | null>(null);
  const token = getSession()?.token;
  const valid = term.trim().length >= MIN_SEARCH_LENGTH;
  const key = `${term}|${token ?? ''}`;

  let state: State = { status: 'idle' };
  if (valid && stored?.key === key) state = stored.state;
  // Mientras llega la nueva búsqueda se siguen viendo los resultados anteriores (sin parpadeo).
  else if (valid) {
    state = {
      status: 'loading',
      previous: stored?.state.status === 'ready' ? stored.state.results : undefined,
    };
  }

  useEffect(() => {
    if (!valid) return;
    let active = true;
    search(term, token).then((result) => {
      if (!active) return;
      setStored({
        key,
        state: result.ok
          ? { status: 'ready', results: result.data }
          : { status: 'error', error: result.error },
      });
    });
    return () => {
      active = false;
    };
  }, [key, term, token, valid]);

  return state;
}

// Carga una ficha (álbum o canción) y va trayendo más reseñas al pulsar «Ver más reseñas».
import { useCallback, useEffect, useState } from 'react';

import {
  getReviews,
  type ItemKind,
  type LoadResult,
  type Review,
  type ReviewsPage,
} from '../../services/api';
import { getSession } from '../../services/session';

type WithReviews = { reviews: ReviewsPage };

type State<T> =
  | { status: 'loading' }
  | { status: 'error'; notFound: boolean; error: string }
  | { status: 'ready'; item: T; reviews: Review[]; total: number };

// Cada respuesta se guarda con la petición a la que contesta: si cambia el id (o se reintenta),
// lo guardado ya no vale y la pantalla vuelve a «cargando» sin tocar el estado dentro del efecto.
type Stored<T> = { key: string; state: State<T> };

export function useCatalogItem<T extends WithReviews>(
  kind: ItemKind,
  id: string,
  load: (id: string, token?: string) => Promise<LoadResult<T>>,
) {
  const [stored, setStored] = useState<Stored<T> | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const token = getSession()?.token;
  const key = `${kind}|${id}|${attempt}|${token ?? ''}`;
  const state: State<T> = stored?.key === key ? stored.state : { status: 'loading' };

  useEffect(() => {
    let active = true;
    load(id, token).then((result) => {
      if (!active) return;
      setStored({
        key,
        state: result.ok
          ? {
              status: 'ready',
              item: result.data,
              reviews: result.data.reviews.items,
              total: result.data.reviews.total,
            }
          : { status: 'error', notFound: result.notFound, error: result.error },
      });
    });
    return () => {
      active = false;
    };
  }, [key, id, token, load]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  const loadedCount = state.status === 'ready' ? state.reviews.length : null;

  const loadMore = useCallback(async () => {
    if (loadedCount === null) return;
    setLoadingMore(true);
    setLoadMoreError(null);
    const result = await getReviews(kind, id, loadedCount, token);
    setLoadingMore(false);
    if (!result.ok) {
      setLoadMoreError(result.error);
      return;
    }
    setStored((current) => {
      if (!current || current.key !== key || current.state.status !== 'ready') return current;
      const ready = current.state;
      const known = new Set(ready.reviews.map((review) => review.id));
      const added = result.data.items.filter((review) => !known.has(review.id));
      return {
        key,
        state: { ...ready, total: result.data.total, reviews: [...ready.reviews, ...added] },
      };
    });
  }, [kind, id, key, loadedCount, token]);

  return { state, retry, loadMore, loadingMore, loadMoreError, signedIn: Boolean(token) };
}

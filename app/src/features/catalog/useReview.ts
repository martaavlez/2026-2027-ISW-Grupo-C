// HU-23 · Publica la reseña con la nota marcada, HU-08 · guarda sus cambios y HU-47 · la elimina.
// En los tres casos la ficha se actualiza sin recargar.
import { useRouter } from 'expo-router';
import { useState } from 'react';

import {
  editReview,
  publishReview,
  removeReview,
  type FieldErrors,
  type ItemKind,
  type Privacy,
  type PublishResult,
  type RemoveReviewResult,
  type Review,
} from '../../services/api';
import { clearSession, getSession } from '../../services/session';

type Published = Extract<PublishResult, { ok: true }>['data'];
type Removed = Extract<RemoveReviewResult, { ok: true }>['data'];
type Summary = Omit<Published, 'review'> | Omit<Removed, 'removedReviewId'>;

/** Lo que la pantalla tiene que cambiar en la ficha ya cargada. */
type Ficha = {
  updateItem: (summary: Summary) => void;
  addReview: (review: Review) => void;
  replaceReview: (review: Review) => void;
  removeReview: (reviewId: string) => void;
};

const NO_RATING = 'Selecciona una puntuación del 1 al 5 para publicar la reseña.';
const NO_TEXT = 'Escribe tu reseña antes de publicarla.';

export function useReview(kind: ItemKind, id: string, rating: number | null, ficha: Ficha) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  /** Con sesión guardada, un 401 es que el token ya no vale: se pide entrar de nuevo. */
  function expired(needsLogin: boolean, hadSession: boolean) {
    if (!needsLogin || !hadSession) return false;
    clearSession();
    router.replace({ pathname: '/acceso', params: { aviso: 'caducada' } });
    return true;
  }

  /** Publica o guarda cambios. Devuelve true si se ha guardado. */
  async function send(mode: 'publish' | 'edit', body: string, privacy: Privacy) {
    // PA-23-04: se avisa antes de enviar; la API lo comprueba igualmente.
    const formErrors: FieldErrors = {};
    if (rating === null) formErrors.rating = NO_RATING;
    if (!body.trim()) formErrors.body = NO_TEXT;
    if (Object.keys(formErrors).length > 0 || rating === null) {
      setErrors(formErrors);
      return false;
    }
    const session = getSession();
    setSending(true);
    setErrors({});
    const call = mode === 'publish' ? publishReview : editReview;
    const result = await call(kind, id, { rating, body, privacy }, session?.token);
    setSending(false);
    if (result.ok) {
      const { review, ...summary } = result.data;
      ficha.updateItem(summary);
      if (mode === 'publish') ficha.addReview(review);
      else ficha.replaceReview(review);
      return true;
    }
    if (!expired(result.needsLogin, Boolean(session))) setErrors(result.errors);
    return false;
  }

  /** HU-47 · Elimina tu reseña y su valoración. */
  async function remove() {
    const session = getSession();
    setRemoving(true);
    setRemoveError(null);
    const result = await removeReview(kind, id, session?.token);
    setRemoving(false);
    if (result.ok) {
      const { removedReviewId, ...summary } = result.data;
      ficha.updateItem(summary);
      ficha.removeReview(removedReviewId);
      return;
    }
    if (!expired(result.needsLogin, Boolean(session))) setRemoveError(result.error);
  }

  // Al elegir una nota o seguir escribiendo, los avisos anteriores ya no aplican.
  const visibleErrors =
    rating !== null && errors.rating === NO_RATING ? { ...errors, rating: undefined } : errors;
  const clearErrors = () => {
    setErrors({});
    setRemoveError(null);
  };

  return {
    publishing: sending,
    errors: visibleErrors,
    publish: (body: string, privacy: Privacy) => send('publish', body, privacy),
    save: (body: string, privacy: Privacy) => send('edit', body, privacy),
    remove,
    removing,
    removeError,
    clearErrors,
  };
}

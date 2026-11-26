// HU-23 · Publica la reseña con la nota marcada y actualiza la ficha sin recargar.
import { useRouter } from 'expo-router';
import { useState } from 'react';

import {
  publishReview,
  type FieldErrors,
  type ItemKind,
  type Privacy,
  type PublishResult,
  type Review,
} from '../../services/api';
import { clearSession, getSession } from '../../services/session';

type Published = Extract<PublishResult, { ok: true }>['data'];

const NO_RATING = 'Selecciona una puntuación del 1 al 5 para publicar la reseña.';
const NO_TEXT = 'Escribe tu reseña antes de publicarla.';

export function useReview(
  kind: ItemKind,
  id: string,
  rating: number | null,
  onPublished: (data: Omit<Published, 'review'>) => void,
  onNewReview: (review: Review) => void,
) {
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  async function publish(body: string, privacy: Privacy) {
    // PA-23-04: se avisa antes de enviar; la API lo comprueba igualmente.
    const formErrors: FieldErrors = {};
    if (rating === null) formErrors.rating = NO_RATING;
    if (!body.trim()) formErrors.body = NO_TEXT;
    if (Object.keys(formErrors).length > 0 || rating === null) {
      setErrors(formErrors);
      return;
    }
    const session = getSession();
    setPublishing(true);
    setErrors({});
    const result = await publishReview(kind, id, { rating, body, privacy }, session?.token);
    setPublishing(false);
    if (result.ok) {
      const { review, ...summary } = result.data;
      onPublished(summary);
      onNewReview(review);
      return;
    }
    if (result.needsLogin && session) {
      clearSession();
      router.replace({ pathname: '/acceso', params: { aviso: 'caducada' } });
      return;
    }
    setErrors(result.errors);
  }

  // Al elegir una nota o seguir escribiendo, los avisos anteriores ya no aplican.
  const visibleErrors =
    rating !== null && errors.rating === NO_RATING ? { ...errors, rating: undefined } : errors;
  const clearErrors = () => setErrors({});

  return { publishing, errors: visibleErrors, publish, clearErrors };
}

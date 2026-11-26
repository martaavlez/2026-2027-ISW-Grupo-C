import { useCallback, useRef, useState } from 'react';

import type { Page, PageResult } from '../../services/api';

/**
 * Lista larga por partes: empieza con los primeros elementos y cada «Ver más» trae los
 * siguientes. Si la sesión ha caducado, avisa con `onExpired`.
 */
export function useMore<T extends { id: string }>(
  first: Page<T>,
  loadFrom: (offset: number) => Promise<PageResult<T>>,
  onExpired: () => void,
) {
  const [items, setItems] = useState(first.items);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ended, setEnded] = useState(false);
  const busy = useRef(false);

  const loadMore = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError(null);
    const result = await loadFrom(items.length);
    busy.current = false;
    setLoading(false);
    if (result.ok) {
      // Si algo cambió entre medias, no se repite ninguno.
      const seen = new Set(items.map((item) => item.id));
      setItems([...items, ...result.data.items.filter((item) => !seen.has(item.id))]);
      // Una parte incompleta es la última, aunque el total ya no cuadre (se borró algo).
      if (result.data.items.length < result.data.pageSize) setEnded(true);
    } else if (result.needsLogin) onExpired();
    else setError(result.error);
  }, [items, loadFrom, onExpired]);

  const remaining = ended ? 0 : Math.max(0, first.total - items.length);
  return { items, remaining, loading, error, loadMore };
}

// Dirección de la API y de las imágenes que sirve. Va aparte de api.ts para que los tests que
// simulan las llamadas a la API sigan pudiendo mostrar imágenes.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

/**
 * Dirección de una imagen lista para mostrar. Las fotos que suben los usuarios (HU-45) las sirve
 * la propia API y llegan como dirección relativa (/users/…/photo).
 */
export function imageUri(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith('/') ? `${API_URL}${url}` : url;
}

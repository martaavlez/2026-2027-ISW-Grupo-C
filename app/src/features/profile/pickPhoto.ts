// HU-45 · Elegir una foto del dispositivo para el perfil.
import * as ImagePicker from 'expo-image-picker';

export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const PHOTO_MAX_BYTES = 1024 * 1024;

export type PickedPhoto =
  { ok: true; blob: Blob; preview: string } | { ok: false; error: string } | null;

/**
 * Abre la galería (en la web, el selector de archivos). null si se cancela. La API vuelve a
 * comprobar el tipo y el tamaño: esto es solo para avisar antes de enviarla.
 */
export async function pickPhoto(): Promise<PickedPhoto> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
  const asset = result.canceled ? null : result.assets[0];
  if (!asset) return null;
  const blob = await (await fetch(asset.uri)).blob();
  if (!PHOTO_TYPES.includes(blob.type)) {
    return { ok: false, error: 'La foto tiene que ser una imagen JPEG, PNG o WebP.' };
  }
  if (blob.size > PHOTO_MAX_BYTES) {
    return { ok: false, error: 'La foto puede ocupar como máximo 1 MB.' };
  }
  return { ok: true, blob, preview: asset.uri };
}

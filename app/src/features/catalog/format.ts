// Formatos de las fichas en español: notas, cantidades, duraciones y fechas.
import type { Album, RatingDistribution } from '../../services/api';

const decimal = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** 4.8 → «4,8». Sin valoraciones → «–». */
export function formatRating(rating: number | null): string {
  return rating === null ? '–' : decimal.format(rating);
}

/** 1204 → «1.204» (también con 4 cifras, que Intl deja sin punto en español). */
export function formatCount(count: number): string {
  return String(count).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** 222 → «3:42». */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

/** 2760 → «46 min»; 3900 → «1 h 5 min». */
export function formatTotalDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const rest = minutes % 60;
  return rest ? `${Math.floor(minutes / 60)} h ${rest} min` : `${minutes / 60} h`;
}

/** 4 → «★★★★☆». */
export function stars(rating: number): string {
  const full = Math.max(0, Math.min(5, Math.round(rating)));
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

const TYPE_LABELS: Record<Album['type'], string> = { album: 'Álbum', ep: 'EP', single: 'Single' };

export function albumTypeLabel(type: Album['type']): string {
  return TYPE_LABELS[type];
}

const TYPE_PLURALS: Record<Album['type'], string> = {
  album: 'Álbumes',
  ep: 'EPs',
  single: 'Singles',
};

export function albumTypePlural(type: Album['type']): string {
  return TYPE_PLURALS[type];
}

export const ALBUM_TYPES: Album['type'][] = ['album', 'ep', 'single'];

/** Separa la discografía en álbumes, EPs y singles, sin cambiar el orden de cada grupo. */
export function groupByType<T extends { type: Album['type'] }>(items: T[]) {
  return ALBUM_TYPES.map((type) => ({ type, items: items.filter((item) => item.type === type) }));
}

/** Porcentaje de cada nota, redondeado. Sin valoraciones, todo 0. */
export function ratingPercentages(distribution: RatingDistribution): Record<string, number> {
  const total = Object.values(distribution).reduce((sum, value) => sum + value, 0);
  const result: Record<string, number> = {};
  for (const [rating, count] of Object.entries(distribution)) {
    result[rating] = total ? Math.round((count / total) * 100) : 0;
  }
  return result;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function plural(value: number, singular: string, pluralForm: string) {
  return `hace ${value} ${value === 1 ? singular : pluralForm}`;
}

/** Fecha relativa como en el diseño: «hace 2 días», «hace 1 semana». */
export function relativeTime(isoDate: string, now: Date = new Date()): string {
  const elapsed = Math.max(0, now.getTime() - new Date(isoDate).getTime());
  if (elapsed < MINUTE) return 'ahora mismo';
  if (elapsed < HOUR) return plural(Math.floor(elapsed / MINUTE), 'minuto', 'minutos');
  if (elapsed < DAY) return plural(Math.floor(elapsed / HOUR), 'hora', 'horas');
  if (elapsed < 7 * DAY) return plural(Math.floor(elapsed / DAY), 'día', 'días');
  if (elapsed < 30 * DAY) return plural(Math.floor(elapsed / (7 * DAY)), 'semana', 'semanas');
  if (elapsed < 365 * DAY) return plural(Math.floor(elapsed / (30 * DAY)), 'mes', 'meses');
  return plural(Math.floor(elapsed / (365 * DAY)), 'año', 'años');
}

/** «ÁLBUM · 2026 · DREAM POP», sin los datos que falten. */
export function headline(parts: (string | number | null | undefined)[]): string {
  return parts
    .filter((part) => part !== null && part !== undefined && part !== '')
    .join(' · ')
    .toUpperCase();
}

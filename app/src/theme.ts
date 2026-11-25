// Diseño de Hertz: modo claro y oscuro (docs/diseno/hertz.md · 2. Tokens).
// El modo se elige según la preferencia del sistema (prefers-color-scheme).
import { useColorScheme } from 'react-native';

export type Colors = {
  background: string;
  surface: string;
  ink: string;
  shadow: string;
  accent: string;
  accentText: string;
  onAccent: string;
  kraft: string;
  folderOpen: string;
  starEmpty: string;
  wormBody: string;
};

export const lightColors: Colors = {
  background: '#F4EFE6',
  surface: '#FBF8F2',
  ink: '#161412',
  shadow: '#161412',
  accent: '#FF2E97',
  accentText: '#C2186F',
  onAccent: '#161412',
  kraft: '#E4DCCD',
  folderOpen: '#F9D7E6',
  starEmpty: '#C9C2B4',
  wormBody: '#FFFFFF',
};

export const darkColors: Colors = {
  background: '#141210',
  surface: '#1E1B18',
  ink: '#F2ECE1',
  shadow: '#56504A',
  accent: '#FF5CAB',
  accentText: '#FF8CC4',
  onAccent: '#141210',
  kraft: '#2B2722',
  folderOpen: '#3B2231',
  starEmpty: '#4A443C',
  wormBody: '#1E1B18',
};

/** Nombres de las fuentes que se cargan en app/_layout.tsx. */
export const fonts = {
  display: 'ArchivoCondensed-Black',
  body: 'Archivo_400Regular',
  bodyBold: 'Archivo_700Bold',
  bodyExtraBold: 'Archivo_800ExtraBold',
  mono: 'DMMono_400Regular',
  monoMedium: 'DMMono_500Medium',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 36 };

/** Ancho a partir del cual se usa la composición de ordenador. */
export const DESKTOP_MIN_WIDTH = 960;

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? darkColors : lightColors;
}

/** Sombra sólida desplazada del diseño (botones 3 px, tarjetas y carpetas 4–6 px). */
export function offsetShadow(colors: Colors, size: number) {
  return { boxShadow: `${size}px ${size}px 0 ${colors.shadow}` };
}

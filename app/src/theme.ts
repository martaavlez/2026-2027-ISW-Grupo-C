// Tema «Neón oscuro · versión calmada» (diseño «Repeat · Temas retro»).
import { Platform } from 'react-native';

export const colors = {
  background: '#0D0221',
  surface: '#1E1050',
  border: '#3A2A6E',
  divider: '#24154D',
  text: '#F4F1FF',
  textMuted: '#B9A8E8',
  cyan: '#00F0FF',
  pink: '#FF2E97',
  yellow: '#FFE45E',
  onCyan: '#0D0221',
  pinkSoft: 'rgba(255, 46, 151, 0.10)',
};

/** Nombres de las fuentes que se cargan en app/_layout.tsx. */
export const fonts = {
  logo: 'Silkscreen_700Bold',
  heading: 'PixelifySans_700Bold',
  body: 'IBMPlexSans_400Regular',
  bodyMedium: 'IBMPlexSans_500Medium',
  bodyBold: 'IBMPlexSans_600SemiBold',
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 20, xl: 24 };

/** Brillo neón del logo y de los textos destacados. */
export const neonGlow = {
  textShadowColor: 'rgba(0, 240, 255, 0.7)',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 8,
};

/** Fondo con la cuadrícula suave del diseño (solo en la web, donde se usa CSS). */
export const gridBackground =
  Platform.OS === 'web'
    ? ({
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '16px 16px',
      } as object)
    : {};

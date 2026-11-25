import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { useColors } from '../theme';
import { WORM_SVGS, WormPose } from './worms';

/**
 * Gusanillo compañero: solo decoración, con los colores del tema.
 * El View lo oculta a los lectores de pantalla (aria-hidden funciona en web,
 * iOS y Android); el SVG no recibe props de accesibilidad porque en web
 * acabarían en el <svg> y React avisa de que no las reconoce.
 */
export function Worm({ pose, width }: { pose: WormPose; width: number }) {
  const colors = useColors();
  const xml = WORM_SVGS[pose]
    .replaceAll('{INK}', colors.ink)
    .replaceAll('{BODY}', colors.wormBody)
    .replaceAll('{ACCENT}', colors.accent);
  return (
    <View aria-hidden>
      <SvgXml xml={xml} width={width} height={(width * 170) / 220} />
    </View>
  );
}

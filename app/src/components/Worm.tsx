import { SvgXml } from 'react-native-svg';

import { useColors } from '../theme';
import { WORM_SVGS, WormPose } from './worms';

/** Gusanillo compañero: solo decoración, con los colores del tema. */
export function Worm({ pose, width }: { pose: WormPose; width: number }) {
  const colors = useColors();
  const xml = WORM_SVGS[pose]
    .replaceAll('{INK}', colors.ink)
    .replaceAll('{BODY}', colors.wormBody)
    .replaceAll('{ACCENT}', colors.accent);
  return (
    <SvgXml
      xml={xml}
      width={width}
      height={(width * 170) / 220}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

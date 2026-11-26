import { useState } from 'react';
import { Image, StyleSheet, useColorScheme, View } from 'react-native';

import { useColors } from '../theme';

const CASE = {
  light: require('../../assets/images/cd/cd_caja_transparente.png'),
  dark: require('../../assets/images/cd/cd_caja_transparente_oscuro.png'),
};
const DISC = {
  light: require('../../assets/images/cd/cd_disco_capa_superior.png'),
  dark: require('../../assets/images/cd/cd_disco_capa_superior_oscuro.png'),
};

// Medidas del diseño (caja de 420 px): el disco ocupa 353 px y empieza en (46, 34).
const DISC_SIZE = 353 / 420;
const DISC_LEFT = 46 / 420;
const DISC_TOP = 34 / 420;
const HOLE = 0.28;
const CASE_INSET = 0.012;

/**
 * La portada impresa en un CD dentro de su caja transparente (diseño de la ficha).
 * Si no hay portada o no carga, el disco sale del color del tema. Es decoración: la
 * información ya está en el título, así que se oculta a los lectores de pantalla.
 */
export function CdCase({ coverUrl, size }: { coverUrl: string | null; size: number }) {
  const colors = useColors();
  const mode = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [failed, setFailed] = useState(false);
  const disc = size * DISC_SIZE;
  const hole = disc * HOLE;

  return (
    <View aria-hidden style={{ width: size, height: size }}>
      {/* Sombra sólida de la caja: una sombra de caja, porque un filtro oscurecería el plástico. */}
      <View
        style={[
          styles.layer,
          {
            left: size * CASE_INSET,
            top: size * CASE_INSET,
            width: size * (1 - 2 * CASE_INSET),
            height: size * (1 - 2 * CASE_INSET),
            borderRadius: size * 0.02,
            boxShadow: `6px 6px 0 ${colors.shadow}`,
          },
        ]}
      />
      <View
        style={[
          styles.disc,
          {
            left: size * DISC_LEFT,
            top: size * DISC_TOP,
            width: disc,
            height: disc,
            borderRadius: disc / 2,
            backgroundColor: colors.accent,
          },
        ]}
      >
        {coverUrl && !failed ? (
          <Image
            source={{ uri: coverUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            onError={() => setFailed(true)}
          />
        ) : null}
        <View
          style={{
            width: hole,
            height: hole,
            borderRadius: hole / 2,
            backgroundColor: colors.background,
          }}
        />
      </View>
      <Image source={DISC[mode]} style={[styles.layer, { width: size, height: size }]} />
      <Image source={CASE[mode]} style={[styles.layer, { width: size, height: size }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: 0, top: 0 },
  disc: {
    position: 'absolute',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

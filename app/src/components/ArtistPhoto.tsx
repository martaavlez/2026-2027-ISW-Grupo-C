import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { fonts, useColors } from '../theme';

/**
 * Foto redonda del artista con la sombra sólida del diseño. Sin foto (o si no carga),
 * su inicial sobre el rosa de Hertz. Es decoración: el nombre ya está en el título.
 */
export function ArtistPhoto({
  name,
  imageUrl,
  size,
}: {
  name: string;
  imageUrl: string | null;
  size: number;
}) {
  const colors = useColors();
  const [failed, setFailed] = useState(false);
  return (
    <View
      aria-hidden
      style={[
        styles.photo,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: colors.ink,
          backgroundColor: colors.accent,
          boxShadow: `6px 6px 0 ${colors.shadow}`,
        },
      ]}
    >
      {imageUrl && !failed ? (
        <Image
          source={{ uri: imageUrl }}
          style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <Text style={[styles.initial, { color: colors.onAccent, fontSize: size * 0.45 }]}>
          {name.charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  photo: { borderWidth: 2.5, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  initial: { fontFamily: fonts.display },
});

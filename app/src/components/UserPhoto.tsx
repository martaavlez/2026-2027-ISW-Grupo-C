import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { imageUri } from '../services/api-url';
import { fonts, useColors } from '../theme';

/** Foto redonda del usuario; sin foto (o si no carga), su inicial. */
export function UserPhoto({
  url,
  name,
  size = 64,
}: {
  url: string | null;
  name: string;
  size?: number;
}) {
  const colors = useColors();
  const [failed, setFailed] = useState<string | null>(null);
  const uri = imageUri(url);
  return (
    <View
      aria-hidden
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: colors.ink,
          backgroundColor: colors.folderOpen,
        },
      ]}
    >
      {uri && failed !== uri ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => setFailed(uri)}
        />
      ) : (
        <Text style={[styles.initial, { color: colors.ink, fontSize: size * 0.42 }]}>
          {name.charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { borderWidth: 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: fonts.display },
});

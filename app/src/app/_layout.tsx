import {
  Archivo_400Regular,
  Archivo_700Bold,
  Archivo_800ExtraBold,
} from '@expo-google-fonts/archivo';
import { DMMono_400Regular, DMMono_500Medium } from '@expo-google-fonts/dm-mono';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { SessionCheck } from '../components/SessionCheck';
import { useColors } from '../theme';

export default function RootLayout() {
  const colors = useColors();
  const [fontsLoaded] = useFonts({
    // Archivo al 62 % de ancho y peso 900, generada desde la fuente variable de Google (OFL).
    'ArchivoCondensed-Black': require('../../assets/fonts/ArchivoCondensed-Black.ttf'),
    Archivo_400Regular,
    Archivo_700Bold,
    Archivo_800ExtraBold,
    DMMono_400Regular,
    DMMono_500Medium,
  });

  // Hasta que cargan las fuentes se muestra el fondo, para que el texto no cambie de golpe.
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: colors.background }} />;

  return (
    <>
      <StatusBar style="auto" />
      <SessionCheck />
      <Stack
        screenOptions={{
          headerShown: false,
          title: 'Hertz',
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}

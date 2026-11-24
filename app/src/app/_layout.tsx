import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans';
import { PixelifySans_700Bold } from '@expo-google-fonts/pixelify-sans';
import { Silkscreen_700Bold } from '@expo-google-fonts/silkscreen';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { colors } from '../theme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Silkscreen_700Bold,
    PixelifySans_700Bold,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });

  // Hasta que cargan las fuentes se muestra el fondo, para que el texto no cambie de golpe.
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: colors.background }} />;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
      />
    </>
  );
}

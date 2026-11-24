import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ApiStatus, getApiStatus } from '../services/api';

const STATUS_TEXT: Record<ApiStatus | 'loading', string> = {
  loading: 'Comprobando la conexión con la API…',
  ok: 'API conectada',
  error: 'No se puede conectar con la API',
};

export default function HomeScreen() {
  const [status, setStatus] = useState<ApiStatus | 'loading'>('loading');

  useEffect(() => {
    getApiStatus().then(setStatus);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Repeat</Text>
      <Text style={styles.subtitle}>Valora, reseña y comparte tu música</Text>
      <Text testID="api-status" style={styles.status}>
        {STATUS_TEXT[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  title: { fontSize: 40, fontWeight: '700' },
  subtitle: { fontSize: 16 },
  status: { marginTop: 16, fontSize: 14 },
});

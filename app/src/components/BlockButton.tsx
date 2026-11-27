import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { blockUser } from '../services/blocks-api';
import { fonts, useColors } from '../theme';
import { Button } from './Button';

/**
 * HU-35 · «Bloquear» en el perfil de otro usuario, después de confirmarlo (PA-35-01). Al
 * bloquearlo deja de ver tu perfil y no puede seguirte ni enviarte solicitudes (PA-35-02).
 */
export function BlockButton({
  username,
  token,
  onBlocked,
  onExpired,
}: {
  username: string;
  token: string;
  onBlocked: () => void;
  onExpired: () => void;
}) {
  const colors = useColors();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ink = { color: colors.ink };

  async function block() {
    setBusy(true);
    setError(null);
    const result = await blockUser(username, token);
    setBusy(false);
    if (result.ok) onBlocked();
    else if (result.needsLogin) onExpired();
    else setError(result.error);
  }

  if (!confirming) {
    return (
      <View style={styles.start}>
        <Button
          label="Bloquear"
          variant="secondary"
          accessibilityLabel={`Bloquear a @${username}`}
          onPress={() => setConfirming(true)}
        />
      </View>
    );
  }

  return (
    <View
      accessibilityRole="alert"
      style={[styles.confirm, { borderColor: colors.ink, backgroundColor: colors.surface }]}
    >
      <Text style={[styles.question, ink]}>
        ¿Bloquear a @{username}? Dejará de ver tu perfil y no podrá seguirte ni enviarte solicitudes
        de amistad. Se eliminan el seguimiento y la amistad entre vosotros. Puedes desbloquearlo
        cuando quieras desde la carpeta Amigos de tu perfil.
      </Text>
      {error ? (
        <Text accessibilityRole="alert" style={[styles.question, { color: colors.accentText }]}>
          {error}
        </Text>
      ) : null}
      <View style={styles.row}>
        <Button
          label="Cancelar"
          variant="secondary"
          disabled={busy}
          onPress={() => setConfirming(false)}
        />
        <Button label="Sí, bloquear" variant="dark" loading={busy} onPress={block} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  start: { alignSelf: 'flex-start' },
  confirm: { borderWidth: 2, padding: 14, gap: 10, maxWidth: 520 },
  question: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
});

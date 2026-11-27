import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  cancelFriendRequest,
  removeFriend,
  respondFriendRequest,
  sendFriendRequest,
  type FriendResult,
  type FriendshipState,
} from '../services/api';
import { fonts, useColors } from '../theme';
import { Button } from './Button';

type Props = {
  username: string;
  state: FriendshipState;
  token: string;
  /** Tras cada cambio, con el estado nuevo (el perfil se recarga: cambia lo que puedes ver). */
  onChange: (state: FriendshipState) => void;
  onExpired: () => void;
};

/**
 * Botón de amistad del perfil de otro usuario.
 * HU-41 · «Añadir amigo» envía la solicitud; volver a pulsarlo la cancela (PA-41-02, RN-11).
 * HU-58 · Si te la ha enviado él, puedes aceptarla o rechazarla.
 * HU-42 · Si sois amigos, puedes eliminar la amistad, después de confirmarlo.
 */
export function FriendButton({ username, state, token, onChange, onExpired }: Props) {
  const colors = useColors();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const ink = { color: colors.ink };

  async function run(call: () => Promise<FriendResult>) {
    setBusy(true);
    setError(null);
    const result = await call();
    setBusy(false);
    setConfirming(false);
    if (result.ok) onChange(result.data);
    else if (result.needsLogin) onExpired();
    else setError(result.error);
  }

  const requestId = state.requestId ?? '';

  return (
    <View style={styles.box}>
      {state.friendship === 'none' ? (
        <Button
          label="+ Añadir amigo"
          loading={busy}
          onPress={() => run(() => sendFriendRequest(username, token))}
        />
      ) : null}

      {state.friendship === 'sent' ? (
        <>
          <Button
            label="Solicitud enviada · Cancelar"
            variant="secondary"
            loading={busy}
            onPress={() => run(() => cancelFriendRequest(username, token))}
          />
          <Text style={[styles.help, ink]}>Pendiente de que @{username} la acepte.</Text>
        </>
      ) : null}

      {state.friendship === 'received' ? (
        <>
          <Text style={[styles.help, ink]}>@{username} quiere ser tu amigo.</Text>
          <View style={styles.row}>
            <Button
              label="Aceptar solicitud"
              loading={busy}
              onPress={() => run(() => respondFriendRequest(requestId, true, token))}
            />
            <Button
              label="Rechazar"
              variant="secondary"
              disabled={busy}
              onPress={() => run(() => respondFriendRequest(requestId, false, token))}
            />
          </View>
        </>
      ) : null}

      {state.friendship === 'friends' && !confirming ? (
        <View style={styles.row}>
          <Text style={[styles.badge, { color: colors.accentText }]}>✓ SOIS AMIGOS</Text>
          <Button
            label="Eliminar amistad"
            variant="secondary"
            onPress={() => setConfirming(true)}
          />
        </View>
      ) : null}

      {state.friendship === 'friends' && confirming ? (
        <View
          accessibilityRole="alert"
          style={[styles.confirm, { borderColor: colors.ink, backgroundColor: colors.surface }]}
        >
          <Text style={[styles.question, ink]}>
            ¿Eliminar a @{username} de tus amigos? Dejaréis de ver el contenido «solo amigos» del
            otro. Si le sigues, le seguirás siguiendo.
          </Text>
          <View style={styles.row}>
            <Button
              label="Cancelar"
              variant="secondary"
              disabled={busy}
              onPress={() => setConfirming(false)}
            />
            <Button
              label="Sí, eliminar"
              variant="dark"
              loading={busy}
              onPress={() => run(() => removeFriend(username, token))}
            />
          </View>
        </View>
      ) : null}

      {error ? (
        <Text accessibilityRole="alert" style={[styles.error, { color: colors.accentText }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 8, marginTop: 6, alignItems: 'flex-start' },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', alignItems: 'center' },
  help: { fontFamily: fonts.mono, fontSize: 12 },
  badge: { fontFamily: fonts.monoMedium, fontSize: 12 },
  confirm: { borderWidth: 2, padding: 14, gap: 10, maxWidth: 520 },
  question: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  error: { fontFamily: fonts.body, fontSize: 13 },
});

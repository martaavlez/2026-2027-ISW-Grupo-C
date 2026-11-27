import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  followUser,
  unfollowUser,
  type FollowResult,
  type FollowState,
} from '../services/follows-api';
import { fonts, useColors } from '../theme';
import { Button } from './Button';

/**
 * Botón de seguir del perfil de otro usuario.
 * HU-10 · «Seguir»: le sigues al momento, sin aprobación (PA-10-01, RN-10).
 * HU-48 · «Siguiendo · Dejar de seguir»: dejas de seguirle (PA-48-01).
 */
export function FollowButton({
  username,
  following,
  token,
  onChange,
  onExpired,
}: {
  username: string;
  following: boolean;
  token: string;
  /** Tras cada cambio (el perfil se recarga para actualizar sus seguidores). */
  onChange: (state: FollowState) => void;
  onExpired: () => void;
}) {
  const colors = useColors();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(call: () => Promise<FollowResult<FollowState>>) {
    setBusy(true);
    setError(null);
    const result = await call();
    setBusy(false);
    if (result.ok) onChange(result.data);
    else if (result.needsLogin) onExpired();
    else setError(result.error);
  }

  return (
    <View style={styles.box}>
      {following ? (
        <Button
          label="✓ Siguiendo · Dejar de seguir"
          variant="secondary"
          loading={busy}
          accessibilityLabel={`Dejar de seguir a @${username}`}
          onPress={() => run(() => unfollowUser(username, token))}
        />
      ) : (
        <Button
          label="Seguir"
          variant="dark"
          loading={busy}
          accessibilityLabel={`Seguir a @${username}`}
          onPress={() => run(() => followUser(username, token))}
        />
      )}
      {error ? (
        <Text accessibilityRole="alert" style={[styles.error, { color: colors.accentText }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 6 },
  error: { fontFamily: fonts.body, fontSize: 14 },
});

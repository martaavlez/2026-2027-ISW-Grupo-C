import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useMore } from '../features/profile/useMore';
import {
  getFriendRequests,
  getFriends,
  removeFriend,
  respondFriendRequest,
  type Friend,
  type FriendRequest,
  type FriendResult,
  type Page,
} from '../services/api';
import { fonts, useColors } from '../theme';
import { Button } from './Button';
import { MoreButton } from './MoreButton';
import { Row, Section, Thumb } from './SearchResultList';

type Props = {
  token: string;
  onExpired: () => void;
  /** Tras aceptar o eliminar, para que el perfil actualice su número de amigos. */
  onChanged: () => void;
};

type Loaded = { requests: FriendRequest[]; friends: Page<Friend> };

const profileHref = (username: string) => `/usuario/${encodeURIComponent(username)}`;
// «Ver más» no repite a nadie: cada amigo se identifica por su nombre de usuario.
const withId = (friend: Friend) => ({ ...friend, id: friend.username });

/**
 * Carpeta Amigos de tu perfil: las solicitudes que has recibido, para aceptarlas o
 * rechazarlas (HU-58), y tus amigos, con la opción de eliminar la amistad (HU-42).
 */
export function FriendsFolder({ token, onExpired, onChanged }: Props) {
  const colors = useColors();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([getFriendRequests(token), getFriends(token, 0)]).then(([requests, friends]) => {
      if (!active) return;
      if (requests.ok && friends.ok) {
        setLoaded({ requests: requests.data, friends: friends.data });
        setError(null);
      } else if ((!requests.ok && requests.needsLogin) || (!friends.ok && friends.needsLogin)) {
        onExpired();
      } else {
        setError(!requests.ok ? requests.error : !friends.ok ? friends.error : null);
      }
    });
    return () => {
      active = false;
    };
  }, [token, onExpired, version]);

  const changed = useCallback(() => {
    setVersion((value) => value + 1);
    onChanged();
  }, [onChanged]);

  if (error) {
    return (
      <Text accessibilityRole="alert" style={[styles.message, { color: colors.accentText }]}>
        {error}
      </Text>
    );
  }
  if (!loaded) return <ActivityIndicator color={colors.accent} accessibilityLabel="Cargando" />;
  return (
    <FriendsLists
      key={version}
      loaded={loaded}
      token={token}
      onExpired={onExpired}
      onChanged={changed}
    />
  );
}

function FriendsLists({ loaded, token, onExpired, onChanged }: Props & { loaded: Loaded }) {
  const colors = useColors();
  const ink = { color: colors.ink };
  const [busy, setBusy] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadFrom = useCallback(
    async (offset: number) => {
      const result = await getFriends(token, offset);
      if (!result.ok) return result;
      return {
        ok: true as const,
        data: { ...result.data, items: result.data.items.map(withId) },
      };
    },
    [token],
  );
  const more = useMore(
    {
      total: loaded.friends.total,
      items: loaded.friends.items.map(withId),
    },
    loadFrom,
    onExpired,
  );

  async function run(key: string, call: () => Promise<FriendResult>) {
    setBusy(key);
    setError(null);
    const result = await call();
    setBusy(null);
    if (result.ok) onChanged();
    else if (result.needsLogin) onExpired();
    else setError(result.error);
  }

  if (loaded.requests.length === 0 && loaded.friends.total === 0) {
    return (
      <Text style={[styles.message, ink]}>
        Todavía no tienes amigos. Busca a alguien con la lupa y pulsa «+ Añadir amigo» en su perfil.
      </Text>
    );
  }

  return (
    <View style={styles.sections}>
      {error ? (
        <Text accessibilityRole="alert" style={[styles.message, { color: colors.accentText }]}>
          {error}
        </Text>
      ) : null}
      <Section title="SOLICITUDES RECIBIDAS" count={loaded.requests.length}>
        {loaded.requests.map((request) => (
          <Row
            key={request.id}
            thumb={<Thumb url={request.photoUrl} label={request.username} round />}
            title={`@${request.username}`}
            href={profileHref(request.username)}
            detail={request.name}
            actions={
              <>
                <Button
                  label="Aceptar"
                  loading={busy === `accept-${request.id}`}
                  disabled={busy !== null}
                  onPress={() =>
                    run(`accept-${request.id}`, () => respondFriendRequest(request.id, true, token))
                  }
                />
                <Button
                  label="Rechazar"
                  variant="secondary"
                  disabled={busy !== null}
                  onPress={() =>
                    run(`reject-${request.id}`, () =>
                      respondFriendRequest(request.id, false, token),
                    )
                  }
                />
              </>
            }
          />
        ))}
      </Section>
      <Section
        title="AMIGOS"
        count={loaded.friends.total}
        footer={
          <MoreButton
            label="VER MÁS AMIGOS"
            remaining={more.remaining}
            loading={more.loading}
            error={more.error}
            onPress={more.loadMore}
          />
        }
      >
        {more.items.map((friend) => (
          <View key={friend.username}>
            <Row
              thumb={<Thumb url={friend.photoUrl} label={friend.username} round />}
              title={`@${friend.username}`}
              href={profileHref(friend.username)}
              detail={friend.name}
              actions={
                confirming === friend.username ? null : (
                  <Button
                    label="Eliminar"
                    variant="secondary"
                    disabled={busy !== null}
                    onPress={() => setConfirming(friend.username)}
                  />
                )
              }
            />
            {confirming === friend.username ? (
              <View
                accessibilityRole="alert"
                style={[
                  styles.confirm,
                  { borderColor: colors.ink, backgroundColor: colors.surface },
                ]}
              >
                <Text style={[styles.question, ink]}>
                  ¿Eliminar a @{friend.username} de tus amigos? Si le sigues, le seguirás siguiendo.
                </Text>
                <View style={styles.row}>
                  <Button
                    label="Cancelar"
                    variant="secondary"
                    disabled={busy !== null}
                    onPress={() => setConfirming(null)}
                  />
                  <Button
                    label="Sí, eliminar"
                    variant="dark"
                    loading={busy === `remove-${friend.username}`}
                    onPress={() =>
                      run(`remove-${friend.username}`, () => removeFriend(friend.username, token))
                    }
                  />
                </View>
              </View>
            ) : null}
          </View>
        ))}
      </Section>
      {loaded.friends.total === 0 ? (
        <Text style={[styles.message, ink]}>
          Cuando aceptes una solicitud, tu nuevo amigo aparecerá aquí.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sections: { gap: 32 },
  message: { fontFamily: fonts.body, fontSize: 16 },
  confirm: { borderWidth: 2, padding: 14, gap: 10, marginBottom: 10 },
  question: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
});

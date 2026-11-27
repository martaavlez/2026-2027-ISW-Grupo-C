import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useMore } from '../features/profile/useMore';
import type { Page } from '../services/api';
import { getFollowing, unfollowUser, type Followed } from '../services/follows-api';
import { fonts, useColors } from '../theme';
import { Button } from './Button';
import { MoreButton } from './MoreButton';
import { Row, Section, Thumb } from './SearchResultList';

const profileHref = (username: string) => `/usuario/${encodeURIComponent(username)}`;
const withId = (person: Followed) => ({ ...person, id: person.username });

/**
 * «Siguiendo», en la carpeta Amigos de tu perfil: a quién sigues (PA-10-01), con la opción de
 * dejar de seguir a cada uno (PA-48-01).
 */
export function FollowingList({
  token,
  onExpired,
  onChanged,
}: {
  token: string;
  onExpired: () => void;
  /** Tras dejar de seguir, para que el perfil actualice su número de seguidos. */
  onChanged: () => void;
}) {
  const colors = useColors();
  const [first, setFirst] = useState<Page<Followed> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    getFollowing(token, 0).then((result) => {
      if (!active) return;
      if (result.ok) {
        setFirst(result.data);
        setError(null);
      } else if (result.needsLogin) onExpired();
      else setError(result.error);
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
  if (!first) return <ActivityIndicator color={colors.accent} accessibilityLabel="Cargando" />;
  return (
    <Following
      key={version}
      first={first}
      token={token}
      onExpired={onExpired}
      onChanged={changed}
    />
  );
}

function Following({
  first,
  token,
  onExpired,
  onChanged,
}: {
  first: Page<Followed>;
  token: string;
  onExpired: () => void;
  onChanged: () => void;
}) {
  const colors = useColors();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadFrom = useCallback(
    async (offset: number) => {
      const result = await getFollowing(token, offset);
      if (!result.ok) return result;
      return { ok: true as const, data: { ...result.data, items: result.data.items.map(withId) } };
    },
    [token],
  );
  const more = useMore({ total: first.total, items: first.items.map(withId) }, loadFrom, onExpired);

  async function unfollow(username: string) {
    setBusy(username);
    setError(null);
    const result = await unfollowUser(username, token);
    setBusy(null);
    if (result.ok) onChanged();
    else if (result.needsLogin) onExpired();
    else setError(result.error);
  }

  return (
    <View style={styles.box}>
      {error ? (
        <Text accessibilityRole="alert" style={[styles.message, { color: colors.accentText }]}>
          {error}
        </Text>
      ) : null}
      <Section
        title="SIGUIENDO"
        count={first.total}
        footer={
          <MoreButton
            label="VER MÁS"
            remaining={more.remaining}
            loading={more.loading}
            error={more.error}
            onPress={more.loadMore}
          />
        }
      >
        {more.items.map((person) => (
          <Row
            key={person.username}
            thumb={<Thumb url={person.photoUrl} label={person.username} round />}
            title={`@${person.username}`}
            href={profileHref(person.username)}
            detail={person.name}
            actions={
              <Button
                label="No seguir"
                variant="secondary"
                loading={busy === person.username}
                disabled={busy !== null}
                accessibilityLabel={`Dejar de seguir a @${person.username}`}
                onPress={() => unfollow(person.username)}
              />
            }
          />
        ))}
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 12 },
  message: { fontFamily: fonts.body, fontSize: 16 },
});

import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useMore } from '../features/profile/useMore';
import type { Page } from '../services/api';
import { getBlocked, unblockUser, type Blocked } from '../services/blocks-api';
import { fonts, useColors } from '../theme';
import { Button } from './Button';
import { MoreButton } from './MoreButton';
import { Row, Section, Thumb } from './SearchResultList';

const profileHref = (username: string) => `/usuario/${encodeURIComponent(username)}`;
const withId = (person: Blocked) => ({ ...person, id: person.username });

/**
 * «Bloqueados», en la carpeta Amigos de tu perfil: a quién has bloqueado (HU-35), con la opción
 * de desbloquear a cada uno (PA-56-01). Si no tienes a nadie bloqueado, no se muestra.
 */
export function BlockedList({
  token,
  onExpired,
  onChanged,
}: {
  token: string;
  onExpired: () => void;
  /** Tras desbloquear (el perfil se vuelve a pedir). */
  onChanged: () => void;
}) {
  const colors = useColors();
  const [first, setFirst] = useState<Page<Blocked> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    getBlocked(token, 0).then((result) => {
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
    <BlockedPeople
      key={version}
      first={first}
      token={token}
      onExpired={onExpired}
      onChanged={changed}
    />
  );
}

function BlockedPeople({
  first,
  token,
  onExpired,
  onChanged,
}: {
  first: Page<Blocked>;
  token: string;
  onExpired: () => void;
  onChanged: () => void;
}) {
  const colors = useColors();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadFrom = useCallback(
    async (offset: number) => {
      const result = await getBlocked(token, offset);
      if (!result.ok) return result;
      return { ok: true as const, data: { ...result.data, items: result.data.items.map(withId) } };
    },
    [token],
  );
  const more = useMore({ total: first.total, items: first.items.map(withId) }, loadFrom, onExpired);

  async function unblock(username: string) {
    setBusy(username);
    setError(null);
    const result = await unblockUser(username, token);
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
        title="BLOQUEADOS"
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
                label="Desbloquear"
                variant="secondary"
                loading={busy === person.username}
                disabled={busy !== null}
                accessibilityLabel={`Desbloquear a @${person.username}`}
                onPress={() => unblock(person.username)}
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

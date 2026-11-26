import { StyleSheet, Text, View } from 'react-native';

import { formatCount, formatRating, ratingPercentages } from '../features/catalog/format';
import type { RatingDistribution } from '../services/api';
import { fonts, useColors } from '../theme';

type Props = {
  averageRating: number | null;
  ratingsCount: number;
  distribution: RatingDistribution;
};

/** Nota media grande y una barra por cada nota con su porcentaje (RN-07). */
export function RatingSummary({ averageRating, ratingsCount, distribution }: Props) {
  const colors = useColors();
  const percentages = ratingPercentages(distribution);
  const countLabel =
    ratingsCount === 0
      ? 'SIN VALORACIONES TODAVÍA'
      : `MEDIA · ${formatCount(ratingsCount)} ${ratingsCount === 1 ? 'VALORACIÓN' : 'VALORACIONES'}`;

  return (
    <View style={styles.summary}>
      <View style={styles.average}>
        <Text style={[styles.number, { color: colors.ink }]}>{formatRating(averageRating)}</Text>
        <Text style={[styles.mono, { color: colors.ink }]}>{countLabel}</Text>
      </View>
      {(['5', '4', '3', '2', '1'] as const).map((rating) => (
        <View
          key={rating}
          style={styles.row}
          accessible
          accessibilityLabel={`${rating} estrellas: ${percentages[rating]} %`}
        >
          <Text style={[styles.mono, styles.label, { color: colors.ink }]}>{rating}</Text>
          <View style={[styles.bar, { borderColor: colors.ink }]}>
            <View
              style={{
                width: `${percentages[rating]}%`,
                height: '100%',
                backgroundColor: colors.ink,
              }}
            />
          </View>
          <Text style={[styles.mono, styles.percent, { color: colors.ink }]}>
            {percentages[rating]}%
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { gap: 8 },
  average: { flexDirection: 'row', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' },
  number: { fontFamily: fonts.display, fontSize: 64, lineHeight: 58 },
  mono: { fontFamily: fonts.mono, fontSize: 11 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { width: 16 },
  bar: { flex: 1, height: 8, borderWidth: 1.5 },
  percent: { width: 36, textAlign: 'right' },
});

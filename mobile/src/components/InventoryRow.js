import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme/tokens';

export function InventoryRow({ name, stock, place }) {
  return (
    <View style={styles.row}>
      <View style={styles.icon} />
      <View style={styles.content}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.meta}>{stock}</Text>
      </View>
      <Text style={styles.place}>{place}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft
  },
  content: {
    flex: 1,
    gap: 4
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700'
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13
  },
  place: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700'
  }
});

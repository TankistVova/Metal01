import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme/tokens';

export function DayChip({ label, date, active }) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
      <View style={[styles.dateWrap, active && styles.dateWrapActive]}>
        <Text style={[styles.date, active && styles.dateActive]}>{date}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    width: 74,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm
  },
  chipActive: {
    backgroundColor: colors.card,
    borderColor: colors.card
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700'
  },
  labelActive: {
    color: '#d9f4e4'
  },
  dateWrap: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.white
  },
  dateWrapActive: {
    backgroundColor: '#2d6b56'
  },
  date: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800'
  },
  dateActive: {
    color: colors.white
  }
});

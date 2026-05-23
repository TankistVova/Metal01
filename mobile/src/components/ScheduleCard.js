import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme/tokens';

export function ScheduleCard({ title, time, note }) {
  return (
    <View style={styles.card}>
      <View style={styles.timeBox}>
        <Text style={styles.time}>{time}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.note}>{note}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  timeBox: {
    minWidth: 72,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.sm
  },
  time: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center'
  },
  content: {
    flex: 1,
    gap: 4
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700'
  },
  note: {
    color: colors.textMuted,
    fontSize: 14
  }
});

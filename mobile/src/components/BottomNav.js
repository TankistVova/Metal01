import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme/tokens';

const items = [
  { key: 'home', label: 'Главная' },
  { key: 'calendar', label: 'Календарь' },
  { key: 'inventory', label: 'Аптечка' },
  { key: 'profile', label: 'Профиль' }
];

export function BottomNav({ activeTab, onChange }) {
  return (
    <View style={styles.wrap}>
      {items.map((item) => {
        const active = item.key === activeTab;

        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            style={[styles.item, active && styles.itemActive]}
          >
            <View style={[styles.dot, active && styles.dotActive]} />
            <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: 6
  },
  itemActive: {
    backgroundColor: colors.accentSoft
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.border
  },
  dotActive: {
    backgroundColor: colors.accent
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700'
  },
  labelActive: {
    color: colors.text
  }
});

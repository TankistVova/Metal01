import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { SectionTitle } from '../components/SectionTitle';
import { StatCard } from '../components/StatCard';
import { profileStats } from '../data/mockData';
import { colors, radius, spacing } from '../theme/tokens';

export function ProfileScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SectionTitle
        eyebrow="Профиль"
        title="Семья и настройки"
        caption="Здесь можно будет хранить личные данные, роли и управление уведомлениями."
      />

      <View style={styles.hero}>
        <View style={styles.avatar} />
        <View style={styles.heroText}>
          <Text style={styles.name}>Владимир</Text>
          <Text style={styles.email}>admin@projectaptechka.space</Text>
        </View>
      </View>

      <View style={styles.stats}>
        {profileStats.map((item) => (
          <StatCard key={item.id} label={item.label} value={item.value} />
        ))}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Следующий шаг</Text>
        <Text style={styles.panelText}>
          Подключить реальные данные пользователя и разделить профиль, членов семьи и настройки приложения.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    backgroundColor: colors.background
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceStrong
  },
  heroText: {
    gap: 4
  },
  name: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800'
  },
  email: {
    color: colors.textMuted,
    fontSize: 14
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md
  },
  panel: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    gap: spacing.sm
  },
  panelTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800'
  },
  panelText: {
    color: '#e5f3ea',
    fontSize: 14,
    lineHeight: 21
  }
});

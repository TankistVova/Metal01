import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { QuickActionCard } from '../components/QuickActionCard';
import { ScheduleCard } from '../components/ScheduleCard';
import { SectionTitle } from '../components/SectionTitle';
import { quickActions, upcomingMedicines } from '../data/mockData';
import { colors, radius, spacing } from '../theme/tokens';

export function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Aptechka Mobile</Text>
        <Text style={styles.heroTitle}>Мобильная версия для семьи и расписания</Text>
        <Text style={styles.heroText}>
          Этот экран можно использовать как стартовую точку, пока мы переносим твой дизайн в Expo.
        </Text>
      </View>

      <SectionTitle
        eyebrow="Быстрый старт"
        title="Основные разделы"
        caption="Каркас уже готов под аптечки, календарь и совместный доступ."
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.actionsRow}
      >
        {quickActions.map((item) => (
          <QuickActionCard
            key={item.id}
            title={item.title}
            subtitle={item.subtitle}
          />
        ))}
      </ScrollView>

      <SectionTitle
        eyebrow="Сегодня"
        title="Ближайшие напоминания"
        caption="Пока здесь моковые данные, позже подключим реальные записи из Supabase."
      />

      <View style={styles.scheduleList}>
        {upcomingMedicines.map((item) => (
          <ScheduleCard
            key={item.id}
            title={item.title}
            time={item.time}
            note={item.note}
          />
        ))}
      </View>

      <View style={styles.footerNote}>
        <Text style={styles.footerTitle}>Что дальше</Text>
        <Text style={styles.footerText}>
          Можно подключить авторизацию, сделать навигацию и начать перенос экранов из дизайна один за другим.
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
  heroCard: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    gap: spacing.sm
  },
  heroEyebrow: {
    color: '#c9ead6',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase'
  },
  heroTitle: {
    color: colors.white,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800'
  },
  heroText: {
    color: '#eef8f2',
    fontSize: 15,
    lineHeight: 22
  },
  actionsRow: {
    gap: spacing.md,
    paddingRight: spacing.md
  },
  scheduleList: {
    gap: spacing.md
  },
  footerNote: {
    padding: spacing.lg,
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.md,
    gap: spacing.xs
  },
  footerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700'
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21
  }
});

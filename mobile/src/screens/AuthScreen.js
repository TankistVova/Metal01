import { StyleSheet, Text, View } from 'react-native';

import { AuthCard } from '../components/AuthCard';
import { colors, spacing } from '../theme/tokens';

export function AuthScreen({ onContinue }) {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Mobile App</Text>
        <Text style={styles.title}>Лекарства, аптечки и напоминания в одном приложении</Text>
        <Text style={styles.caption}>
          Этот экран подготовлен как отдельная точка входа для мобильной версии на Expo.
        </Text>
      </View>

      <AuthCard onContinue={onContinue} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
    gap: spacing.xl
  },
  hero: {
    gap: spacing.sm
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase'
  },
  title: {
    color: colors.text,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800'
  },
  caption: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 23
  }
});

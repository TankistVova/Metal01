import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius, spacing } from '../theme/tokens';

export function AuthCard({ onContinue }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Вход в Aptechka</Text>
      <Text style={styles.subtitle}>
        Временный экран авторизации. Здесь позже подключим реальный Supabase Auth.
      </Text>

      <View style={styles.form}>
        <TextInput placeholder="Email" placeholderTextColor={colors.textMuted} style={styles.input} />
        <TextInput
          placeholder="Пароль"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          style={styles.input}
        />
      </View>

      <Pressable onPress={onContinue} style={styles.button}>
        <Text style={styles.buttonText}>Продолжить</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800'
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22
  },
  form: {
    gap: spacing.sm
  },
  input: {
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: colors.card,
    borderRadius: radius.md
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800'
  }
});

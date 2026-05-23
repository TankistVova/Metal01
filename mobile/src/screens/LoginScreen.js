import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthField } from '../components/AuthField';
import { PrimaryButton } from '../components/PrimaryButton';
import { signIn } from '../lib/auth';
import { colors } from '../theme/colors';

const closedEyeIcon = require('../../assets/icons/closed-eye.png');

export function LoginScreen({ onOpenRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const canSubmit = useMemo(
    () => email.trim() !== '' && password.trim() !== '',
    [email, password]
  );

  const handleLogin = async () => {
    if (!canSubmit) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await signIn({ email, password });
    } catch (error) {
      setMessage(error.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Вход в аккаунт</Text>
      </View>

      <View style={styles.form}>
        <AuthField
          label="Логин"
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
        />
        <AuthField
          label="Пароль"
          value={password}
          onChangeText={setPassword}
          placeholder="Пароль"
          secureTextEntry={!showPassword}
          rightAction={{
            icon: showPassword ? undefined : closedEyeIcon,
            eyeState: showPassword ? 'open' : undefined,
            onPress: () => setShowPassword((v) => !v)
          }}
        />

        <Pressable>
          <Text style={styles.forgot}>Забыли пароль?</Text>
        </Pressable>

        {message ? <Text style={styles.error}>{message}</Text> : null}

        <PrimaryButton title="Войти" onPress={handleLogin} disabled={!canSubmit} loading={loading} style={styles.button} />

        <View style={styles.dividerRow}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>или</Text>
          <View style={styles.line} />
        </View>

        <Text style={styles.bottomText}>
          Нет аккаунта?{' '}
          <Text style={styles.link} onPress={onOpenRegister}>
            Зарегистрироваться
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.authBackground,
    paddingHorizontal: 33,
    paddingTop: 112
  },
  header: {
    alignItems: 'center',
    marginBottom: 80
  },
  title: {
    color: colors.authTitle,
    fontSize: 22,
    fontWeight: '800'
  },
  form: {
    gap: 16
  },
  forgot: {
    color: colors.accent,
    textAlign: 'center',
    textDecorationLine: 'underline',
    fontWeight: '600',
    fontSize: 12,
    marginTop: -2
  },
  error: {
    color: colors.error,
    fontSize: 13,
    textAlign: 'center'
  },
  button: {
    marginTop: 28,
    minHeight: 46
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#89cdeb'
  },
  dividerText: {
    color: colors.authLabel,
    fontWeight: '700'
  },
  bottomText: {
    color: colors.authLabel,
    textAlign: 'center',
    fontSize: 15,
    marginTop: 2
  },
  link: {
    color: colors.accent,
    textDecorationLine: 'underline',
    fontWeight: '700'
  }
});

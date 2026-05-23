import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthField } from '../components/AuthField';
import { PrimaryButton } from '../components/PrimaryButton';
import { signUp } from '../lib/auth';
import { colors } from '../theme/colors';

const closedEyeIcon = require('../../assets/icons/closed-eye.png');

export function RegisterScreen({ onOpenLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const canSubmit = useMemo(() => {
    return (
      name.trim() !== '' &&
      email.trim() !== '' &&
      password.trim() !== '' &&
      confirmPassword.trim() !== '' &&
      agreed
    );
  }, [agreed, confirmPassword, email, name, password]);

  const handleRegister = async () => {
    if (!canSubmit) {
      return;
    }

    if (password.length < 6) {
      setMessage('Пароль должен быть минимум 6 символов');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Пароли не совпадают');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await signUp({ name, email, phone, password });
      setMessage('Регистрация успешна. Теперь можно войти.');
      setTimeout(onOpenLogin, 1200);
    } catch (error) {
      setMessage(error.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Регистрация</Text>
        <Text style={styles.subtitle}>Создайте аккаунт, чтобы свободно пользоваться цифровой аптечкой.</Text>
      </View>

      <View style={styles.form}>
        <AuthField label="ФИО" value={name} onChangeText={setName} placeholder="Ваше имя" autoCapitalize="words" />
        <AuthField label="Логин" value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" />
        <AuthField label="Телефон" value={phone} onChangeText={setPhone} placeholder="+7..." keyboardType="phone-pad" />
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
        <AuthField
          label="Повторите пароль"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Повторите пароль"
          secureTextEntry={!showConfirmPassword}
          rightAction={{
            icon: showConfirmPassword ? undefined : closedEyeIcon,
            eyeState: showConfirmPassword ? 'open' : undefined,
            onPress: () => setShowConfirmPassword((v) => !v)
          }}
        />

        <Pressable style={styles.checkboxRow} onPress={() => setAgreed((v) => !v)}>
          <View style={[styles.checkbox, agreed && styles.checkboxActive]} />
          <Text style={styles.checkboxText}>Я согласен(на) с политикой конфиденциальности</Text>
        </Pressable>

        {message ? (
          <Text style={[styles.message, message.includes('успеш') ? styles.messageSuccess : styles.messageError]}>
            {message}
          </Text>
        ) : null}

        <PrimaryButton
          title="Зарегистрироваться"
          onPress={handleRegister}
          disabled={!canSubmit}
          loading={loading}
          style={styles.button}
        />

        <View style={styles.dividerRow}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>или</Text>
          <View style={styles.line} />
        </View>

        <Text style={styles.bottomText}>
          Есть аккаунт?{' '}
          <Text style={styles.link} onPress={onOpenLogin}>
            Войти
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
    paddingTop: 54
  },
  header: {
    alignItems: 'center',
    marginBottom: 18,
    gap: 8
  },
  title: {
    color: colors.authTitle,
    fontSize: 22,
    fontWeight: '800'
  },
  subtitle: {
    color: colors.authText,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 250
  },
  form: {
    gap: 14
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.accent
  },
  checkboxActive: {
    backgroundColor: colors.accent
  },
  checkboxText: {
    flex: 1,
    color: colors.authLabel,
    fontSize: 12
  },
  message: {
    textAlign: 'center',
    fontSize: 13
  },
  messageError: {
    color: colors.error
  },
  messageSuccess: {
    color: colors.success
  },
  button: {
    marginTop: 12
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6
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
    fontSize: 15
  },
  link: {
    color: colors.accent,
    textDecorationLine: 'underline',
    fontWeight: '700'
  }
});

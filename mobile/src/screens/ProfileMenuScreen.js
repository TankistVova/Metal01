import { useMemo, useState } from 'react'
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { ProfileMenuCard } from '../components/ProfileMenuCard'
import { signOut } from '../lib/auth'
import { colors } from '../theme/colors'

const medkitIcon = require('../../assets/icons/medkit.png')
const calendarIcon = require('../../assets/icons/calendar.png')
const exitIcon = require('../../assets/icons/exit.png')

function getPushSubtitle(pushState) {
  switch (pushState?.status) {
    case 'enabled':
      return 'Напоминания включены на этом устройстве'
    case 'blocked':
      return 'Разрешение отключено. Нажмите, чтобы попробовать снова'
    case 'disabled':
      return 'Разрешение еще не выдано'
    case 'development-build-required':
      return 'Нужна preview/dev или production-сборка вместо Expo Go'
    case 'simulator':
      return 'Push работают только на реальном устройстве'
    case 'missing-project-id':
      return 'В конфигурации не найден EAS projectId'
    case 'error':
      return pushState.error || 'Не удалось подключить push-уведомления'
    default:
      return 'Подключить напоминания на телефон'
  }
}

export function ProfileMenuScreen({ user, onNavigate, pushState, pushBusy, onEnablePush }) {
  const [loggingOut, setLoggingOut] = useState(false)

  const displayName = useMemo(() => {
    return user?.user_metadata?.name || user?.email?.split('@')[0] || 'Пользователь'
  }, [user])

  const pushSubtitle = useMemo(() => getPushSubtitle(pushState), [pushState])
  const avatarUrl = user?.user_metadata?.avatar_url

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await signOut()
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <View style={styles.topBar}>
        <Pressable hitSlop={12} onPress={() => onNavigate('inventory')}>
          <Text style={styles.topIcon}>‹</Text>
        </Pressable>

        <Pressable hitSlop={12} onPress={handleLogout} disabled={loggingOut}>
          {loggingOut ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Image source={exitIcon} style={styles.topActionIcon} resizeMode="contain" />
          )}
        </Pressable>
      </View>

      <View style={styles.hero}>
        <View style={styles.avatar}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <Text style={styles.avatarText}>{displayName.slice(0, 1).toUpperCase()}</Text>
          )}
        </View>
        <Text style={styles.name}>{displayName}</Text>
      </View>

      <Text style={styles.sectionTitle}>Основные</Text>
      <View style={styles.list}>
        <ProfileMenuCard
          iconSource={medkitIcon}
          title="Мои аптечки"
          subtitle="Просмотреть или управлять"
          onPress={() => onNavigate('inventory')}
        />
        <ProfileMenuCard
          iconSource={calendarIcon}
          title="Календарь"
          subtitle="Ваши напоминания"
          onPress={() => onNavigate('calendar')}
        />
        <ProfileMenuCard
          icon="🔔"
          title="Push-уведомления"
          subtitle={pushSubtitle}
          onPress={onEnablePush}
          disabled={pushBusy}
          trailing={
            pushBusy ? (
              <ActivityIndicator color={colors.accent} />
            ) : pushState?.status === 'enabled' ? (
              <View style={styles.enabledBadge}>
                <Text style={styles.enabledBadgeText}>ON</Text>
              </View>
            ) : null
          }
        />
        <ProfileMenuCard
          icon="ⓘ"
          title="Аккаунт"
          subtitle="Контакты и ваша информация"
          onPress={() => onNavigate('account')}
        />
      </View>

      <Text style={styles.sectionTitle}>Поддержка</Text>
      <View style={styles.list}>
        <ProfileMenuCard
          icon="?"
          title="Поддержка"
          subtitle="Если есть вопросы"
          onPress={() => onNavigate('support')}
        />
      </View>

      <Pressable style={styles.reviewRow}>
        <Text style={styles.reviewText}>Отзывы о приложении</Text>
        <Text style={styles.reviewArrow}>›</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.authBackground
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 124
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18
  },
  topIcon: {
    color: '#6e7492',
    fontSize: 34,
    lineHeight: 34
  },
  topActionIcon: {
    width: 28,
    height: 28,
    tintColor: colors.accent
  },
  hero: {
    alignItems: 'center',
    marginBottom: 36
  },
  avatar: {
    width: 152,
    height: 152,
    borderRadius: 76,
    overflow: 'hidden',
    backgroundColor: '#d9d1ef',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarImage: {
    width: '100%',
    height: '100%'
  },
  avatarText: {
    color: colors.darkText,
    fontSize: 68,
    fontWeight: '800'
  },
  name: {
    marginTop: 18,
    color: colors.darkText,
    fontSize: 31,
    fontWeight: '800',
    lineHeight: 36,
    textAlign: 'center'
  },
  sectionTitle: {
    marginBottom: 14,
    color: colors.authLabel,
    fontSize: 20,
    fontWeight: '700'
  },
  list: {
    gap: 14,
    marginBottom: 34
  },
  reviewRow: {
    marginTop: 8,
    paddingHorizontal: 30,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  enabledBadge: {
    minWidth: 44,
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#E8F8FB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  enabledBadgeText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800'
  },
  reviewText: {
    color: colors.darkText,
    fontSize: 22,
    fontWeight: '800'
  },
  reviewArrow: {
    color: colors.darkText,
    fontSize: 34,
    lineHeight: 34
  }
})

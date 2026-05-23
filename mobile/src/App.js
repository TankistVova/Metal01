import { StatusBar } from 'expo-status-bar'
import { Component, useEffect, useState, useSyncExternalStore } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'

import { AppShell } from './components/AppShell'
import { BottomTabs } from './components/BottomTabs'
import {
  clearRuntimeError,
  getRuntimeError,
  subscribeToRuntimeError
} from './lib/runtimeErrors'
import { supabase } from './lib/supabase'
import { LoginScreen } from './screens/LoginScreen'
import { PlaceholderScreen } from './screens/PlaceholderScreen'
import { RegisterScreen } from './screens/RegisterScreen'
import { SplashScreen } from './screens/SplashScreen'
import { colors } from './theme/colors'

const getInventoryScreen = () => require('./screens/InventoryScreen').InventoryScreen
const getCalendarScreen = () => require('./screens/CalendarScreen').CalendarScreen
const getAddScreen = () => require('./screens/AddScreen').AddScreen
const getScheduleAddScreen = () => require('./screens/ScheduleAddScreen').ScheduleAddScreen
const getProfileMenuScreen = () => require('./screens/ProfileMenuScreen').ProfileMenuScreen

function loadPushNotificationsModule() {
  try {
    return require('./lib/pushNotifications')
  } catch (error) {
    console.warn('Failed to load push notifications module', error)
    return null
  }
}

function getPushModuleErrorState() {
  return {
    status: 'error',
    token: null,
    error: 'Модуль push-уведомлений не загрузился.'
  }
}

class RootErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.fallbackScreen}>
          <StatusBar style="light" />
          <Text style={styles.fallbackTitle}>Приложение столкнулось с ошибкой</Text>
          <Text style={styles.fallbackText}>
            {this.state.error?.message || 'Неизвестная ошибка при запуске.'}
          </Text>
          <Pressable style={styles.fallbackButton} onPress={() => this.setState({ error: null })}>
            <Text style={styles.fallbackButtonText}>Повторить</Text>
          </Pressable>
        </View>
      )
    }

    return this.props.children
  }
}

function GlobalErrorScreen({ error }) {
  return (
    <View style={styles.fallbackScreen}>
      <StatusBar style="light" />
      <Text style={styles.fallbackTitle}>Приложение остановило ошибку</Text>
      <Text style={styles.fallbackText}>
        {error?.message || 'Неизвестная ошибка времени выполнения.'}
      </Text>
      {error?.stack ? (
        <Text style={styles.fallbackStack} numberOfLines={10}>
          {error.stack}
        </Text>
      ) : null}
      <Pressable style={styles.fallbackButton} onPress={clearRuntimeError}>
        <Text style={styles.fallbackButtonText}>Попробовать снова</Text>
      </Pressable>
    </View>
  )
}

function AppContent() {
  const [booting, setBooting] = useState(true)
  const [session, setSession] = useState(null)
  const [authScreen, setAuthScreen] = useState('login')
  const [appScreen, setAppScreen] = useState('profile')
  const [inventoryReturnScreen, setInventoryReturnScreen] = useState('inventory')
  const [pushState, setPushState] = useState({ status: 'idle', token: null, error: '' })
  const [pushBusy, setPushBusy] = useState(false)

  const splashUserName =
    session?.user?.user_metadata?.name ||
    session?.user?.email?.split('@')[0] ||
    'Гость'

  useEffect(() => {
    if (!supabase) {
      setBooting(false)
      return
    }

    let mounted = true
    let timeoutId

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (mounted) {
          setSession(data.session)
        }
      })
      .catch((error) => {
        console.warn('Failed to restore Supabase session', error)

        if (mounted) {
          setSession(null)
          setBooting(false)
        }
      })

    timeoutId = setTimeout(() => {
      if (mounted) {
        setBooting(false)
      }
    }, 1400)

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) {
        return
      }

      setSession(nextSession)

      if (nextSession?.user) {
        setAppScreen('profile')
      }
    })

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session?.user || !supabase) {
      setPushState({ status: 'signed-out', token: null, error: '' })
      setPushBusy(false)
      return
    }

    const pushModule = loadPushNotificationsModule()
    if (!pushModule) {
      setPushState(getPushModuleErrorState())
      setPushBusy(false)
      return
    }

    let active = true
    setPushBusy(true)

    pushModule
      .syncPushRegistration(session.user.id, { requestPermission: false })
      .then((nextState) => {
        if (active) {
          setPushState(nextState)
        }
      })
      .catch((error) => {
        if (active) {
          setPushState({
            status: 'error',
            token: null,
            error: error?.message || String(error)
          })
        }
      })
      .finally(() => {
        if (active) {
          setPushBusy(false)
        }
      })

    return () => {
      active = false
    }
  }, [session?.user?.id])

  const navigateToPushTarget = (target) => {
    if (target === 'calendar' || target === 'inventory' || target === 'profile') {
      setAppScreen(target)
      return
    }

    setAppScreen('calendar')
  }

  useEffect(() => {
    if (!session?.user) {
      return undefined
    }

    const pushModule = loadPushNotificationsModule()
    if (!pushModule) {
      return undefined
    }

    try {
      return pushModule.subscribeToNotificationResponses(navigateToPushTarget)
    } catch (error) {
      console.warn('Failed to subscribe to notification responses', error)
      return undefined
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (!session?.user) {
      return
    }

    const pushModule = loadPushNotificationsModule()
    if (!pushModule) {
      return
    }

    pushModule.handleLastNotificationResponse(navigateToPushTarget).catch((error) => {
      console.warn('Failed to handle last notification response', error)
    })
  }, [session?.user?.id])

  if (booting) {
    return (
      <AppShell>
        <StatusBar style="dark" />
        <SplashScreen userName={splashUserName} />
      </AppShell>
    )
  }

  if (!supabase) {
    return (
      <AppShell>
        <StatusBar style="dark" />
        <PlaceholderScreen
          title="Нужен .env"
          subtitle="Добавь EXPO_PUBLIC_SUPABASE_URL и EXPO_PUBLIC_SUPABASE_ANON_KEY в mobile/.env, затем перезапусти Expo."
          onBack={() => {}}
        />
      </AppShell>
    )
  }

  if (!session?.user) {
    return (
      <AppShell>
        <StatusBar style="dark" />
        {authScreen === 'login' ? (
          <LoginScreen onOpenRegister={() => setAuthScreen('register')} />
        ) : (
          <RegisterScreen onOpenLogin={() => setAuthScreen('login')} />
        )}
      </AppShell>
    )
  }

  const user = session.user

  const enablePushNotifications = async () => {
    const pushModule = loadPushNotificationsModule()
    if (!pushModule) {
      const nextState = getPushModuleErrorState()
      setPushState(nextState)
      Alert.alert('Не удалось включить push', nextState.error)
      return
    }

    setPushBusy(true)

    try {
      const nextState = await pushModule.syncPushRegistration(user.id, {
        requestPermission: true
      })
      setPushState(nextState)

      if (nextState.status === 'enabled') {
        Alert.alert('Push включены', 'Напоминания будут приходить на это устройство.')
        return
      }

      if (nextState.status === 'blocked') {
        Alert.alert(
          'Доступ отключен',
          'Разреши уведомления для Aptechka в настройках телефона.'
        )
        return
      }

      if (nextState.status === 'development-build-required') {
        Alert.alert(
          'Нужна сборка приложения',
          'Push не работают в Expo Go. Нужна preview/dev или production-сборка.'
        )
        return
      }

      if (nextState.status === 'simulator') {
        Alert.alert(
          'Нужно устройство',
          'Push-уведомления проверяются только на реальном устройстве.'
        )
        return
      }

      if (nextState.status === 'missing-project-id') {
        Alert.alert('Нет projectId', 'В конфигурации Expo не найден EAS projectId.')
        return
      }

      if (nextState.status === 'error') {
        Alert.alert(
          'Не удалось включить push',
          nextState.error || 'Повтори попытку после следующей сборки приложения.'
        )
      }
    } catch (error) {
      console.warn('Failed to enable push notifications', error)
      setPushState({
        status: 'error',
        token: null,
        error: error?.message || String(error)
      })
    } finally {
      setPushBusy(false)
    }
  }

  const activeTab =
    appScreen === 'calendar' || appScreen === 'inventory' || appScreen === 'profile'
      ? appScreen
      : undefined

  const openMedicineAdd = (returnScreen = 'inventory') => {
    setInventoryReturnScreen(returnScreen)
    setAppScreen('add')
  }

  const openCenterAdd = () => {
    if (appScreen === 'calendar' || appScreen === 'scheduleAdd') {
      setAppScreen('scheduleAdd')
      return
    }

    openMedicineAdd(appScreen === 'profile' ? 'profile' : 'inventory')
  }

  const bottomTabs = (
    <BottomTabs
      activeTab={activeTab}
      onChange={(tab) => {
        if (tab === 'add') {
          openCenterAdd()
          return
        }

        setAppScreen(tab)
      }}
    />
  )

  if (appScreen === 'inventory') {
    const InventoryScreen = getInventoryScreen()

    return (
      <AppShell bottomBar={bottomTabs}>
        <StatusBar style="dark" />
        <InventoryScreen
          user={user}
          onBack={() => setAppScreen('profile')}
          onOpenAdd={() => openMedicineAdd('inventory')}
        />
      </AppShell>
    )
  }

  if (appScreen === 'calendar') {
    const CalendarScreen = getCalendarScreen()

    return (
      <AppShell bottomBar={bottomTabs}>
        <StatusBar style="dark" />
        <CalendarScreen user={user} onOpenAdd={() => setAppScreen('scheduleAdd')} />
      </AppShell>
    )
  }

  if (appScreen === 'add') {
    const AddScreen = getAddScreen()

    return (
      <AppShell>
        <StatusBar style="dark" />
        <AddScreen
          user={user}
          onBack={() => setAppScreen(inventoryReturnScreen)}
          onCreated={() => setAppScreen('inventory')}
        />
      </AppShell>
    )
  }

  if (appScreen === 'scheduleAdd') {
    const ScheduleAddScreen = getScheduleAddScreen()

    return (
      <AppShell>
        <StatusBar style="dark" />
        <ScheduleAddScreen
          user={user}
          onBack={() => setAppScreen('calendar')}
          onCreated={() => setAppScreen('calendar')}
        />
      </AppShell>
    )
  }

  if (appScreen === 'support') {
    return (
      <AppShell>
        <StatusBar style="light" />
        <PlaceholderScreen
          title="Поддержка"
          subtitle="Экран поддержки можно следующим шагом подключить к контактам, Telegram, WhatsApp или форме обращения."
          onBack={() => setAppScreen('profile')}
        />
      </AppShell>
    )
  }

  if (appScreen === 'account') {
    return (
      <AppShell>
        <StatusBar style="light" />
        <PlaceholderScreen
          title="Аккаунт"
          subtitle={`Email: ${user.email || 'не указан'}\nИмя: ${user.user_metadata?.name || 'не указано'}`}
          onBack={() => setAppScreen('profile')}
        />
      </AppShell>
    )
  }

  const ProfileMenuScreen = getProfileMenuScreen()

  return (
    <AppShell bottomBar={bottomTabs}>
      <StatusBar style="dark" />
      <ProfileMenuScreen
        user={user}
        onNavigate={setAppScreen}
        pushState={pushState}
        pushBusy={pushBusy}
        onEnablePush={enablePushNotifications}
      />
    </AppShell>
  )
}

export default function App() {
  const runtimeError = useSyncExternalStore(
    subscribeToRuntimeError,
    getRuntimeError,
    getRuntimeError
  )

  if (runtimeError) {
    return <GlobalErrorScreen error={runtimeError} />
  }

  return (
    <RootErrorBoundary>
      <AppContent />
    </RootErrorBoundary>
  )
}

const styles = StyleSheet.create({
  fallbackScreen: {
    flex: 1,
    backgroundColor: colors.darkBackground,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24
  },
  fallbackTitle: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center'
  },
  fallbackText: {
    marginTop: 14,
    color: '#B8C0D4',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center'
  },
  fallbackStack: {
    marginTop: 12,
    color: '#90A0C1',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'left'
  },
  fallbackButton: {
    marginTop: 24,
    minHeight: 48,
    minWidth: 144,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  fallbackButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700'
  }
})

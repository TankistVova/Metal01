import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

import { supabase } from './supabase'

const ANDROID_CHANNEL_ID = 'default'
const MOBILE_PUSH_TABLE = 'mobile_push_tokens'
const CACHED_PUSH_TOKEN_KEY = 'aptechka:last-expo-push-token'

let handlerConfigured = false
let lastHandledResponseId = null
let cachedPushToken = null

function toErrorMessage(error) {
  return error?.message || String(error)
}

function configureNotificationHandler() {
  if (handlerConfigured) {
    return
  }

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true
      })
    })

    handlerConfigured = true
  } catch (error) {
    console.warn('Failed to configure notification handler', error)
  }
}

async function getCachedPushToken() {
  if (cachedPushToken) {
    return cachedPushToken
  }

  cachedPushToken = await AsyncStorage.getItem(CACHED_PUSH_TOKEN_KEY)
  return cachedPushToken
}

async function setCachedPushToken(token) {
  cachedPushToken = token || null

  if (token) {
    await AsyncStorage.setItem(CACHED_PUSH_TOKEN_KEY, token)
    return
  }

  await AsyncStorage.removeItem(CACHED_PUSH_TOKEN_KEY)
}

function getPermissionState(permissions) {
  const provisionalStatus = Notifications.IosAuthorizationStatus?.PROVISIONAL

  if (permissions?.granted || permissions?.ios?.status === provisionalStatus) {
    return 'granted'
  }

  return permissions?.status || 'undetermined'
}

function getExpoProjectId() {
  return Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId || null
}

function mapNotificationTarget(data) {
  if (!data || typeof data !== 'object') {
    return null
  }

  if (typeof data.screen === 'string') {
    return data.screen
  }

  if (typeof data.url === 'string') {
    if (data.url.includes('calendar')) {
      return 'calendar'
    }

    if (data.url.includes('inventory')) {
      return 'inventory'
    }

    if (data.url.includes('profile')) {
      return 'profile'
    }
  }

  return null
}

function handleNotificationNavigation(response, onNavigate) {
  const data = response?.notification?.request?.content?.data
  const identifier =
    response?.notification?.request?.identifier ||
    (data ? JSON.stringify(data) : null)

  if (identifier && identifier === lastHandledResponseId) {
    return
  }

  const target = mapNotificationTarget(data)
  if (!target) {
    return
  }

  lastHandledResponseId = identifier || target
  onNavigate?.(target)
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') {
    return
  }

  try {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#31BACB',
      sound: 'default'
    })
  } catch (error) {
    console.warn('Failed to ensure Android notification channel', error)
  }
}

async function getDevicePushToken({ requestPermission }) {
  try {
    configureNotificationHandler()

    if (Platform.OS === 'web') {
      return { status: 'unsupported' }
    }

    if (Constants.executionEnvironment === 'storeClient') {
      return {
        status: 'development-build-required',
        error: 'Push notifications are available only in a development, preview, or production build.'
      }
    }

    if (!Device.isDevice) {
      return {
        status: 'simulator',
        error: 'Push notifications require a physical device.'
      }
    }

    await ensureAndroidChannel()

    let permissions = await Notifications.getPermissionsAsync()
    let permissionState = getPermissionState(permissions)

    if (permissionState !== 'granted' && requestPermission) {
      permissions = await Notifications.requestPermissionsAsync()
      permissionState = getPermissionState(permissions)
    }

    if (permissionState !== 'granted') {
      return {
        status: permissionState === 'denied' ? 'blocked' : 'disabled'
      }
    }

    const projectId = getExpoProjectId()
    if (!projectId) {
      return {
        status: 'missing-project-id',
        error: 'EAS projectId was not found in Expo config.'
      }
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data

    return {
      status: 'enabled',
      token,
      projectId
    }
  } catch (error) {
    return {
      status: 'error',
      error: toErrorMessage(error)
    }
  }
}

export async function syncPushRegistration(userId, options = {}) {
  if (!supabase || !userId) {
    return { status: 'unavailable' }
  }

  const registration = await getDevicePushToken({
    requestPermission: Boolean(options.requestPermission)
  })

  if (registration.status !== 'enabled') {
    return registration
  }

  try {
    const payload = {
      user_id: userId,
      expo_push_token: registration.token,
      project_id: registration.projectId,
      platform: Platform.OS,
      device_name: Device.deviceName || null,
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase.from(MOBILE_PUSH_TABLE).upsert([payload], {
      onConflict: 'expo_push_token'
    })

    if (error) {
      return {
        status: 'error',
        error: error.message
      }
    }

    await setCachedPushToken(registration.token)

    return registration
  } catch (error) {
    return {
      status: 'error',
      error: toErrorMessage(error)
    }
  }
}

export async function removePushRegistration(userId) {
  if (!supabase || !userId || Platform.OS === 'web') {
    return
  }

  const token = await getCachedPushToken()
  if (!token) {
    return
  }

  const { error } = await supabase
    .from(MOBILE_PUSH_TABLE)
    .delete()
    .eq('user_id', userId)
    .eq('expo_push_token', token)

  if (error) {
    throw error
  }

  await setCachedPushToken(null)
}

export function subscribeToNotificationResponses(onNavigate) {
  try {
    configureNotificationHandler()

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationNavigation(response, onNavigate)
    })

    return () => subscription.remove()
  } catch (error) {
    console.warn('Failed to subscribe to notification responses', error)
    return () => {}
  }
}

export async function handleLastNotificationResponse(onNavigate) {
  try {
    configureNotificationHandler()

    if (typeof Notifications.getLastNotificationResponseAsync !== 'function') {
      return
    }

    const response = await Notifications.getLastNotificationResponseAsync()
    handleNotificationNavigation(response, onNavigate)
  } catch (error) {
    console.warn('Failed to handle last notification response', error)
  }
}

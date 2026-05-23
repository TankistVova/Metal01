import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native'

import { getAlertDescription } from '../lib/errors'
import { supabase } from '../lib/supabase'
import { colors } from '../theme/colors'

const pullIcon = require('../../assets/icons/pull.png')
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

let imagePickerModulePromise

const loadImagePickerModule = async () => {
  if (!imagePickerModulePromise) {
    imagePickerModulePromise = import('expo-image-picker')
  }

  return imagePickerModulePromise
}

const avatarOptions = [
  { id: 'home', name: 'Домашняя', icon: 'home-outline', pack: 'ion' },
  { id: 'car', name: 'Автомобильная', icon: 'car-outline', pack: 'ion' },
  { id: 'kids', name: 'Детская', icon: 'baby-face-outline', pack: 'material' },
  { id: 'travel', name: 'Путешествие', icon: 'airplane-outline', pack: 'ion' },
  { id: 'sport', name: 'Спортивная', icon: 'walk-outline', pack: 'ion' },
  { id: 'work', name: 'Рабочая', icon: 'briefcase-outline', pack: 'ion' },
  { id: 'health', name: 'Здоровье', icon: 'heart-outline', pack: 'ion' },
  { id: 'pets', name: 'Питомцы', icon: 'paw-outline', pack: 'ion' },
  { id: 'firstaid', name: 'Первая помощь', icon: 'medical-bag', pack: 'material' },
  { id: 'family', name: 'Семейная', icon: 'people-outline', pack: 'ion' },
  { id: 'personal', name: 'Личная', icon: 'person-outline', pack: 'ion' },
  { id: 'doctor', name: 'Врачебная', icon: 'medical-outline', pack: 'ion' }
]

const categoryOptions = [
  { value: 'pain', label: 'Обезболивающие' },
  { value: 'fever', label: 'Жаропонижающие' },
  { value: 'allergy', label: 'Противоаллергическое' },
  { value: 'antiviral', label: 'Противовирусные' },
  { value: 'vitamins', label: 'Витамины и минералы' },
  { value: 'antistress', label: 'Успокаивающие' },
  { value: 'stomach', label: 'Для желудка' },
  { value: 'other', label: 'Другое' }
]

const doseUnits = ['мг', 'мл', 'г', 'МЕ']
const quantityUnits = ['шт', 'уп', 'мл']

const emptyMedicineForm = {
  name: '',
  dose: '',
  doseUnit: 'мг',
  quantity: '1',
  quantityUnit: 'шт',
  icon: '💊',
  category: 'pain',
  expiryDate: '',
  note: '',
  image: null
}

const emptyKitForm = {
  name: '',
  description: '',
  avatar: 'home'
}

const isValidExpiryDate = (value) => {
  if (!value) {
    return true
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

const renderPackIcon = (item, color) => {
  if (item.pack === 'material') {
    return <MaterialCommunityIcons name={item.icon} size={18} color={color} />
  }

  return <Ionicons name={item.icon} size={18} color={color} />
}

const getKitMeta = (kit, index) => {
  const value = `${kit?.avatar || ''} ${kit?.name || ''}`.toLowerCase()

  if (value.includes('car') || value.includes('авто') || value.includes('машин')) {
    return { icon: 'car-outline', pack: 'ion' }
  }

  if (value.includes('kid') || value.includes('child') || value.includes('baby') || value.includes('реб')) {
    return { icon: 'baby-face-outline', pack: 'material' }
  }

  if (value.includes('med') || value.includes('first')) {
    return { icon: 'medical-bag', pack: 'material' }
  }

  return index % 2 === 1 ? { icon: 'car-outline', pack: 'ion' } : { icon: 'home-outline', pack: 'ion' }
}

const nextOption = (list, current) => {
  const currentIndex = list.indexOf(current)
  return list[(currentIndex + 1 + list.length) % list.length]
}

const nextCategory = (current) => {
  const currentIndex = categoryOptions.findIndex((item) => item.value === current)
  return categoryOptions[(currentIndex + 1 + categoryOptions.length) % categoryOptions.length].value
}

const categoryLabel = (value) => {
  return categoryOptions.find((item) => item.value === value)?.label || 'Другое'
}

function Field({ label, children, rightIcon }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.fieldRow}>
        <View style={styles.fieldContent}>{children}</View>
        {rightIcon ? <View style={styles.fieldIcon}>{rightIcon}</View> : null}
      </View>
    </View>
  )
}

export function AddScreen({ user, onBack, onCreated }) {
  const [mode, setMode] = useState('medicine')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showGalleryPrompt, setShowGalleryPrompt] = useState(false)
  const [aptechkas, setAptechkas] = useState([])
  const [selectedKit, setSelectedKit] = useState(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitedUsers, setInvitedUsers] = useState([])
  const [medicineForm, setMedicineForm] = useState(emptyMedicineForm)
  const [kitForm, setKitForm] = useState(emptyKitForm)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    void loadAptechkas()

    return () => {
      mountedRef.current = false
    }
  }, [user?.id])

  const activeKit = useMemo(() => {
    return aptechkas.find((item) => item.id === selectedKit) || null
  }, [aptechkas, selectedKit])

  useEffect(() => {
    if (!loading && !aptechkas.length && mode !== 'kit') {
      setMode('kit')
    }
  }, [aptechkas.length, loading, mode])

  const loadAptechkas = async () => {
    setLoading(true)
    setLoadError('')

    const userId = user?.id
    if (!userId || !supabase) {
      if (mountedRef.current) {
        setAptechkas([])
        setSelectedKit(null)
        setLoading(false)
      }
      return
    }

    try {
      const { data: owned, error: ownedError } = await supabase
        .from('aptechkas')
        .select('*')
        .eq('owner_id', userId)

      if (ownedError) {
        throw ownedError
      }

      const { data: memberRows, error: memberError } = await supabase
        .from('aptechka_members')
        .select('aptechka_id')
        .eq('user_id', userId)

      if (memberError) {
        throw memberError
      }

      let shared = []

      const sharedIds = [...new Set((memberRows || []).map((row) => row.aptechka_id).filter(Boolean))]
      if (sharedIds.length) {
        const { data, error: sharedError } = await supabase
          .from('aptechkas')
          .select('*')
          .in('id', sharedIds)
          .neq('owner_id', userId)

        if (sharedError) {
          throw sharedError
        }

        shared = data || []
      }

      if (!mountedRef.current) {
        return
      }

      const allKits = [...(owned || []), ...shared]
      setAptechkas(allKits)
      setSelectedKit((current) => {
        if (current && allKits.some((item) => item.id === current)) {
          return current
        }

        return allKits[0]?.id || null
      })
    } catch (error) {
      console.error('Failed to load kits for add screen', error)

      if (mountedRef.current) {
        setAptechkas([])
        setSelectedKit(null)
        setLoadError('Не удалось загрузить аптечки.')
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }

  const resetMedicineForm = () => {
    setMedicineForm(emptyMedicineForm)
  }

  const resetKitForm = () => {
    setKitForm(emptyKitForm)
    setInvitedUsers([])
    setInviteEmail('')
  }

  const requestGalleryAccessAndPick = async () => {
    let ImagePicker

    try {
      ImagePicker = await loadImagePickerModule()
    } catch (error) {
      console.error('Image picker module is unavailable', error)
      Alert.alert(
        'Галерея недоступна',
        'Модуль выбора фото не подключился. Пересобери приложение после установки expo-image-picker.'
      )
      return
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (!permission.granted) {
        Alert.alert('Нужен доступ', 'Разреши доступ к галерее, чтобы загружать фото лекарства.')
        return
      }

      const pickerOptions = {
        allowsEditing: true,
        quality: 0.8
      }

      if (ImagePicker.MediaType?.Images) {
        pickerOptions.mediaTypes = [ImagePicker.MediaType.Images]
      } else if (ImagePicker.MediaTypeOptions?.Images) {
        pickerOptions.mediaTypes = ImagePicker.MediaTypeOptions.Images
      } else {
        pickerOptions.mediaTypes = ['images']
      }

      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions)

      if (result.canceled || !result.assets?.length || !mountedRef.current) {
        return
      }

      const asset = result.assets[0]

      setMedicineForm((current) => ({
        ...current,
        image: {
          uri: asset.uri,
          mimeType: asset.mimeType || 'image/jpeg',
          fileName: asset.fileName || `medicine-${Date.now()}.jpg`
        }
      }))
    } catch (error) {
      console.error('Failed to open gallery picker', error)
      Alert.alert('Ошибка', 'Не удалось открыть галерею. Попробуй еще раз.')
    }
  }

  const uploadMedicineImage = async () => {
    if (!medicineForm.image?.uri || !user?.id || !supabase?.storage) {
      return null
    }

    const response = await fetch(medicineForm.image.uri)
    if (!response.ok) {
      throw new Error('Не удалось прочитать выбранное изображение.')
    }

    const arrayBuffer = await response.arrayBuffer()
    const fileBody = new Uint8Array(arrayBuffer)
    const extension = medicineForm.image.fileName?.split('.').pop() || 'jpg'
    const fileName = `${user.id}/${Date.now()}.${extension}`

    const { error } = await supabase.storage
      .from('medicine-images')
      .upload(fileName, fileBody, {
        contentType: medicineForm.image.mimeType,
        upsert: false
      })

    if (error) {
      throw error
    }

    const { data } = supabase.storage.from('medicine-images').getPublicUrl(fileName)
    return data.publicUrl
  }

  const submitMedicine = async () => {
    if (!supabase) {
      Alert.alert('Нет подключения', 'Сначала настрой подключение к Supabase.')
      return
    }

    if (!selectedKit) {
      Alert.alert('Сначала аптечка', 'Сначала создай аптечку, а потом добавь в нее лекарство.')
      setMode('kit')
      return
    }

    if (!medicineForm.name.trim()) {
      Alert.alert('Нужно название', 'Укажи название лекарства.')
      return
    }

    if (!isValidExpiryDate(medicineForm.expiryDate.trim())) {
      Alert.alert('Неверная дата', 'Срок годности укажи в формате ГГГГ-ММ-ДД.')
      return
    }

    setSubmitting(true)

    try {
      const dose = medicineForm.dose.trim()
        ? `${medicineForm.dose.trim()} ${medicineForm.doseUnit}`.trim()
        : ''

      const imageUrl = await uploadMedicineImage()

      const { error } = await supabase.from('medicines').insert([
        {
          aptechka_id: selectedKit,
          name: medicineForm.name.trim(),
          dose,
          quantity: Number(medicineForm.quantity) || 1,
          icon: medicineForm.icon,
          category: medicineForm.category,
          expiry_date: medicineForm.expiryDate.trim() || null,
          image_url: imageUrl
        }
      ])

      if (error) {
        throw error
      }

      resetMedicineForm()
      if (onCreated) {
        onCreated()
      }
    } catch (error) {
      console.error('Failed to create medicine', error)
      Alert.alert('Ошибка', getAlertDescription(error, 'Не удалось добавить лекарство.'))
      return
      Alert.alert('Ошибка', 'Не удалось добавить лекарство.')
    } finally {
      if (mountedRef.current) {
        setSubmitting(false)
      }
    }
  }

  const submitKit = async () => {
    if (!supabase || !user?.id) {
      Alert.alert('Нет подключения', 'Сначала настрой подключение к Supabase.')
      return
    }

    if (!kitForm.name.trim()) {
      Alert.alert('Нужно название', 'Укажи название аптечки.')
      return
    }

    setSubmitting(true)

    try {
      const { data: aptechka, error } = await supabase
        .from('aptechkas')
        .insert([
          {
            name: kitForm.name.trim(),
            description: kitForm.description.trim(),
            avatar: kitForm.avatar,
            owner_id: user.id,
            owner_name: user.user_metadata?.name || user.email?.split('@')[0] || 'Владелец'
          }
        ])
        .select()
        .single()

      if (error) {
        throw error
      }

      if (!aptechka?.id) {
        throw new Error('Supabase не вернул созданную аптечку.')
      }

      let failedInvites = 0

      if (invitedUsers.length) {
        const inviteResults = await Promise.allSettled(
          invitedUsers.map((email) =>
            supabase.from('aptechka_invites').insert([
              {
                aptechka_id: aptechka.id,
                invited_email: email,
                invited_by: user.id,
                status: 'pending'
              }
            ])
          )
        )

        failedInvites = inviteResults.filter((result) => {
          if (result.status === 'rejected') {
            return true
          }

          return Boolean(result.value?.error)
        }).length
      }

      resetKitForm()
      setSelectedKit(aptechka.id)

      if (failedInvites) {
        Alert.alert(
          'Аптечка создана',
          'Аптечка сохранилась, но часть приглашений не отправилась. Это можно повторить позже.'
        )
      }
      if (onCreated) {
        onCreated()
      } else {
        await loadAptechkas()
      }
    } catch (error) {
      console.error('Failed to create kit', error)
      Alert.alert('Ошибка', getAlertDescription(error, 'Не удалось создать аптечку.'))
      return
      Alert.alert('Ошибка', 'Не удалось создать аптечку.')
    } finally {
      if (mountedRef.current) {
        setSubmitting(false)
      }
    }
  }

  const addInviteUser = () => {
    const normalized = inviteEmail.trim().toLowerCase()

    if (!normalized) {
      return
    }

    if (!emailPattern.test(normalized)) {
      Alert.alert('Неверный email', 'Проверь email и попробуй снова.')
      return
    }

    if (invitedUsers.includes(normalized)) {
      setInviteEmail('')
      return
    }

    setInvitedUsers((current) => [...current, normalized])
    setInviteEmail('')
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Pressable hitSlop={12} onPress={onBack}>
              <Ionicons name="chevron-back" size={30} color={colors.darkText} />
            </Pressable>
            <Text style={styles.title}>{mode === 'medicine' ? 'Добавление лекарства' : 'Создание аптечки'}</Text>
            <Pressable hitSlop={12} onPress={onBack}>
              <Ionicons name="close" size={30} color="#5A82FF" />
            </Pressable>
          </View>

          <View style={styles.modeRow}>
            <Pressable
              style={[styles.modeChip, mode === 'medicine' && styles.modeChipActive]}
              onPress={() => setMode('medicine')}
            >
              <Text style={[styles.modeText, mode === 'medicine' && styles.modeTextActive]}>Лекарство</Text>
            </Pressable>
            <Pressable
              style={[styles.modeChip, mode === 'kit' && styles.modeChipActive]}
              onPress={() => setMode('kit')}
            >
              <Text style={[styles.modeText, mode === 'kit' && styles.modeTextActive]}>Аптечка</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : null}

          {!loading && loadError ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>Не удалось открыть добавление</Text>
              <Text style={styles.stateText}>{loadError}</Text>
              <Pressable style={styles.stateButton} onPress={loadAptechkas}>
                <Text style={styles.stateButtonText}>Повторить</Text>
              </Pressable>
            </View>
          ) : null}

          {!loading && !loadError && mode === 'medicine' ? (
            !activeKit ? (
              <View style={styles.stateCard}>
                <Text style={styles.stateTitle}>Сначала создай аптечку</Text>
                <Text style={styles.stateText}>Без аптечки лекарство некуда сохранить.</Text>
                <Pressable style={styles.stateButton} onPress={() => setMode('kit')}>
                  <Text style={styles.stateButtonText}>Перейти к аптечке</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View style={styles.selectedKitCard}>
                  <View style={styles.selectedKitBadge}>
                    <Text style={styles.selectedKitBadgeText}>{Math.max(aptechkas.length, 1)}</Text>
                  </View>
                  <View style={styles.selectedKitIconWrap}>{renderPackIcon(getKitMeta(activeKit, 0), '#5A82FF')}</View>
                  <Text style={styles.selectedKitText}>{activeKit.name}</Text>
                </View>

                <View style={styles.photoRow}>
                  <Pressable style={styles.photoCard} onPress={() => setShowGalleryPrompt(true)}>
                    {medicineForm.image?.uri ? (
                      <Image source={{ uri: medicineForm.image.uri }} style={styles.photoPreview} resizeMode="cover" />
                    ) : (
                      <Ionicons name="camera-outline" size={30} color="#D1D7E5" />
                    )}
                  </Pressable>

                  <View style={styles.photoCopy}>
                    <Text style={styles.photoTitle}>{medicineForm.image?.fileName || 'Нет фотографии'}</Text>
                    <Text style={styles.photoSubtitle}>Нажми, чтобы выбрать фото лекарства</Text>
                  </View>

                  <Pressable style={styles.photoDots} onPress={() => setShowGalleryPrompt(true)}>
                    <Feather name="more-vertical" size={22} color={colors.accent} />
                  </Pressable>
                </View>

                <Field label="Название">
                  <TextInput
                    value={medicineForm.name}
                    onChangeText={(value) => setMedicineForm((current) => ({ ...current, name: value }))}
                    placeholder="Название"
                    placeholderTextColor="#CDD1DA"
                    style={styles.input}
                  />
                </Field>

                <Field
                  label="Количество"
                  rightIcon={<Image source={pullIcon} style={styles.fieldImageIcon} resizeMode="contain" />}
                >
                  <View style={styles.inlineFields}>
                    <TextInput
                      value={medicineForm.quantity}
                      onChangeText={(value) => setMedicineForm((current) => ({ ...current, quantity: value }))}
                      placeholder="1"
                      placeholderTextColor="#CDD1DA"
                      keyboardType="numeric"
                      style={[styles.input, styles.inlineInput]}
                    />
                    <Pressable
                      style={[styles.select, styles.inlineSelect]}
                      onPress={() =>
                        setMedicineForm((current) => ({
                          ...current,
                          quantityUnit: nextOption(quantityUnits, current.quantityUnit)
                        }))
                      }
                    >
                      <Text style={styles.selectText}>{medicineForm.quantityUnit}</Text>
                    </Pressable>
                  </View>
                </Field>

                <Field label="Дозировка">
                  <View style={styles.inlineFields}>
                    <TextInput
                      value={medicineForm.dose}
                      onChangeText={(value) => setMedicineForm((current) => ({ ...current, dose: value }))}
                      placeholder="500"
                      placeholderTextColor="#CDD1DA"
                      style={[styles.input, styles.inlineInput]}
                    />
                    <Pressable
                      style={[styles.select, styles.inlineSelect]}
                      onPress={() =>
                        setMedicineForm((current) => ({
                          ...current,
                          doseUnit: nextOption(doseUnits, current.doseUnit)
                        }))
                      }
                    >
                      <Text style={styles.selectText}>{medicineForm.doseUnit}</Text>
                    </Pressable>
                  </View>
                </Field>

                <Field label="Категория">
                  <Pressable
                    style={styles.select}
                    onPress={() =>
                      setMedicineForm((current) => ({
                        ...current,
                        category: nextCategory(current.category)
                      }))
                    }
                  >
                    <Text style={styles.selectText}>{categoryLabel(medicineForm.category)}</Text>
                  </Pressable>
                </Field>

                <Field
                  label="Срок годности"
                  rightIcon={<MaterialCommunityIcons name="calendar-heart-outline" size={22} color={colors.darkText} />}
                >
                  <TextInput
                    value={medicineForm.expiryDate}
                    onChangeText={(value) => setMedicineForm((current) => ({ ...current, expiryDate: value }))}
                    placeholder="2025-12-26"
                    placeholderTextColor="#CDD1DA"
                    style={styles.input}
                  />
                </Field>

                <Field label="Примечание">
                  <TextInput
                    value={medicineForm.note}
                    onChangeText={(value) => setMedicineForm((current) => ({ ...current, note: value }))}
                    placeholder="Примечание или инструкция"
                    placeholderTextColor="#CDD1DA"
                    style={[styles.input, styles.textarea]}
                    multiline
                  />
                </Field>

                <Pressable style={styles.primaryButton} onPress={submitMedicine} disabled={submitting}>
                  <Text style={styles.primaryButtonText}>{submitting ? 'Сохраняем...' : 'Добавить'}</Text>
                </Pressable>

                <Pressable style={styles.secondaryButton} onPress={resetMedicineForm}>
                  <Text style={styles.secondaryButtonText}>Очистить</Text>
                </Pressable>
              </>
            )
          ) : null}

          {!loading && !loadError && mode === 'kit' ? (
            <>
              <Field label="Тип аптечки">
                <View style={styles.avatarGrid}>
                  {avatarOptions.map((item) => {
                    const active = kitForm.avatar === item.id

                    return (
                      <Pressable
                        key={item.id}
                        style={[styles.avatarOption, active && styles.avatarOptionActive]}
                        onPress={() => setKitForm((current) => ({ ...current, avatar: item.id }))}
                      >
                        <View style={styles.avatarOptionIcon}>
                          {renderPackIcon(item, active ? '#FFFFFF' : colors.darkText)}
                        </View>
                        <Text style={[styles.avatarOptionText, active && styles.avatarOptionTextActive]}>{item.name}</Text>
                      </Pressable>
                    )
                  })}
                </View>
              </Field>

              <Field label="Название">
                <TextInput
                  value={kitForm.name}
                  onChangeText={(value) => setKitForm((current) => ({ ...current, name: value }))}
                  placeholder="Например: Домашняя аптечка"
                  placeholderTextColor="#CDD1DA"
                  style={styles.input}
                />
              </Field>

              <Field label="Описание">
                <TextInput
                  value={kitForm.description}
                  onChangeText={(value) => setKitForm((current) => ({ ...current, description: value }))}
                  placeholder="Краткое описание"
                  placeholderTextColor="#CDD1DA"
                  style={[styles.input, styles.textarea]}
                  multiline
                />
              </Field>

              <Field label="Пригласить пользователей">
                <View style={styles.inviteRow}>
                  <TextInput
                    value={inviteEmail}
                    onChangeText={setInviteEmail}
                    placeholder="Email пользователя"
                    placeholderTextColor="#CDD1DA"
                    style={[styles.input, styles.inviteInput]}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <Pressable style={styles.inviteButton} onPress={addInviteUser}>
                    <Text style={styles.inviteButtonText}>Добавить</Text>
                  </Pressable>
                </View>

                {invitedUsers.map((email) => (
                  <View key={email} style={styles.invitedRow}>
                    <Text style={styles.invitedText}>{email}</Text>
                    <Pressable onPress={() => setInvitedUsers((current) => current.filter((item) => item !== email))}>
                      <Ionicons name="close" size={18} color={colors.darkText} />
                    </Pressable>
                  </View>
                ))}
              </Field>

              <Pressable style={styles.primaryButton} onPress={submitKit} disabled={submitting}>
                <Text style={styles.primaryButtonText}>{submitting ? 'Создаем...' : 'Создать аптечку'}</Text>
              </Pressable>

              <Pressable style={styles.secondaryButton} onPress={resetKitForm}>
                <Text style={styles.secondaryButtonText}>Очистить</Text>
              </Pressable>
            </>
          ) : null}
        </ScrollView>

        {showGalleryPrompt ? (
          <View style={styles.promptOverlay}>
            <View style={styles.promptCard}>
              <Pressable style={styles.promptClose} onPress={() => setShowGalleryPrompt(false)}>
                <Ionicons name="close" size={18} color="#7C879C" />
              </Pressable>

              <View style={styles.promptIconWrap}>
                <Ionicons name="camera-outline" size={42} color={colors.accent} />
              </View>

              <Text style={styles.promptTitle}>Приложение запрашивает доступ к вашей галерее</Text>
              <Text style={styles.promptText}>Вы сможете загрузить фотографию лекарства прямо оттуда.</Text>

              <View style={styles.promptActions}>
                <Pressable style={styles.promptGhost} onPress={() => setShowGalleryPrompt(false)}>
                  <Text style={styles.promptGhostText}>Запретить</Text>
                </Pressable>

                <Pressable
                  style={styles.promptPrimary}
                  onPress={async () => {
                    setShowGalleryPrompt(false)
                    await requestGalleryAccessAndPick()
                  }}
                >
                  <Text style={styles.promptPrimaryText}>Разрешить</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 104
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  title: {
    flex: 1,
    marginHorizontal: 10,
    color: colors.darkText,
    fontSize: 20,
    fontWeight: '800'
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14
  },
  modeChip: {
    flex: 1,
    minHeight: 38,
    borderRadius: 14,
    backgroundColor: '#F4F7FB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modeChipActive: {
    backgroundColor: '#E8F8FB'
  },
  modeText: {
    color: colors.darkText,
    fontSize: 14,
    fontWeight: '600'
  },
  modeTextActive: {
    color: colors.accent
  },
  loadingWrap: {
    paddingVertical: 26
  },
  stateCard: {
    marginTop: 8,
    marginBottom: 10,
    borderRadius: 24,
    backgroundColor: '#F9FAFB',
    padding: 20,
    gap: 10
  },
  stateTitle: {
    color: colors.darkText,
    fontSize: 20,
    fontWeight: '800'
  },
  stateText: {
    color: colors.darkMuted,
    fontSize: 14,
    lineHeight: 20
  },
  stateButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  selectedKitCard: {
    width: 108,
    height: 76,
    borderRadius: 20,
    backgroundColor: '#E8EDFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 22
  },
  selectedKitBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E6F5',
    alignItems: 'center',
    justifyContent: 'center'
  },
  selectedKitBadgeText: {
    color: colors.darkText,
    fontSize: 12,
    fontWeight: '600'
  },
  selectedKitIconWrap: {
    marginBottom: 4
  },
  selectedKitText: {
    color: '#5A82FF',
    fontSize: 12,
    fontWeight: '500'
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22
  },
  photoCard: {
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: '#F3F5FA',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  photoPreview: {
    width: '100%',
    height: '100%'
  },
  photoCopy: {
    flex: 1,
    marginLeft: 14
  },
  photoTitle: {
    color: colors.darkText,
    fontSize: 17,
    fontWeight: '800'
  },
  photoSubtitle: {
    color: '#92A0B5',
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 2
  },
  photoDots: {
    width: 28,
    alignItems: 'center'
  },
  field: {
    marginBottom: 16
  },
  label: {
    marginBottom: 8,
    color: colors.darkText,
    fontSize: 16,
    fontWeight: '700'
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  fieldContent: {
    flex: 1
  },
  fieldIcon: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center'
  },
  fieldImageIcon: {
    width: 20,
    height: 20,
    tintColor: colors.darkText
  },
  input: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EF',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    color: colors.darkText,
    fontSize: 15
  },
  inlineFields: {
    flexDirection: 'row',
    gap: 8
  },
  inlineInput: {
    flex: 1
  },
  inlineSelect: {
    width: 86
  },
  textarea: {
    minHeight: 90,
    textAlignVertical: 'top',
    paddingTop: 14
  },
  select: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EF',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingHorizontal: 16
  },
  selectText: {
    color: colors.darkText,
    fontSize: 15
  },
  primaryButton: {
    marginTop: 12,
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700'
  },
  secondaryButton: {
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  secondaryButtonText: {
    color: colors.darkText,
    fontSize: 16,
    fontWeight: '500'
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  avatarOption: {
    width: '48%',
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EF',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12
  },
  avatarOptionActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent
  },
  avatarOptionIcon: {
    width: 24,
    alignItems: 'center'
  },
  avatarOptionText: {
    color: colors.darkText,
    fontSize: 13,
    fontWeight: '600'
  },
  avatarOptionTextActive: {
    color: '#FFFFFF'
  },
  inviteRow: {
    flexDirection: 'row',
    gap: 8
  },
  inviteInput: {
    flex: 1
  },
  inviteButton: {
    minWidth: 92,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#EEF7FA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12
  },
  inviteButtonText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700'
  },
  invitedRow: {
    marginTop: 8,
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: '#F7F8FC',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  invitedText: {
    color: colors.darkText,
    fontSize: 13
  },
  promptOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 14
  },
  promptCard: {
    width: '100%',
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
    alignItems: 'center'
  },
  promptClose: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F3F8',
    alignItems: 'center',
    justifyContent: 'center'
  },
  promptIconWrap: {
    marginTop: 6,
    marginBottom: 12
  },
  promptTitle: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 25
  },
  promptText: {
    marginTop: 12,
    color: '#76849A',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21
  },
  promptActions: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    marginTop: 22
  },
  promptGhost: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: '#F1F4FA',
    alignItems: 'center',
    justifyContent: 'center'
  },
  promptGhostText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600'
  },
  promptPrimary: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center'
  },
  promptPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700'
  }
})

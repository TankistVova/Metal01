import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';

const DAY_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const DAY_LABELS = [
  { key: 'mon', label: 'Пн' },
  { key: 'tue', label: 'Вт' },
  { key: 'wed', label: 'Ср' },
  { key: 'thu', label: 'Чт' },
  { key: 'fri', label: 'Пт' },
  { key: 'sat', label: 'Сб' },
  { key: 'sun', label: 'Вс' }
];
const MONTHS = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь'
];

const DOSE_OPTIONS = ['По 1 таблетке', 'По 2 таблетки', '1 капсула', '5 мл'];

const pad = (value) => String(value).padStart(2, '0');

const formatStorageDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const buildWeek = (selectedDate) =>
  Array.from({ length: 7 }, (_, index) => {
    const date = new Date(selectedDate);
    date.setDate(selectedDate.getDate() - 3 + index);
    return date;
  });

const sameDate = (left, right) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const getUserMedicineIds = async (userId) => {
  const { data: owned } = await supabase.from('aptechkas').select('id').eq('owner_id', userId);
  const { data: memberRows } = await supabase.from('aptechka_members').select('aptechka_id').eq('user_id', userId);

  return [
    ...(owned?.map((item) => item.id) || []),
    ...(memberRows?.map((item) => item.aptechka_id) || [])
  ];
};

export function ScheduleAddScreen({ user, onBack, onCreated }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMedicineId, setSelectedMedicineId] = useState(null);
  const [medicineDropdownOpen, setMedicineDropdownOpen] = useState(false);
  const [time, setTime] = useState('08:00');
  const [doseLabel, setDoseLabel] = useState(DOSE_OPTIONS[0]);
  const [selectedDays, setSelectedDays] = useState(() => ({
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: false,
    sun: false
  }));

  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = async () => {
    setLoading(true);
    const aptechkaIds = await getUserMedicineIds(user.id);

    if (!aptechkaIds.length) {
      setMedicines([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('medicines')
      .select('id, name, dose, quantity')
      .in('aptechka_id', aptechkaIds)
      .order('name', { ascending: true });

    const items = data || [];
    setMedicines(items);
    setSelectedMedicineId(items[0]?.id || null);
    if (items[0]?.dose) {
      setDoseLabel(items[0].dose);
    }
    setLoading(false);
  };

  const selectedMedicine = useMemo(() => {
    return medicines.find((item) => item.id === selectedMedicineId) || null;
  }, [medicines, selectedMedicineId]);

  const weekDays = useMemo(() => buildWeek(selectedDate), [selectedDate]);

  const selectMedicine = (medicine) => {
    setSelectedMedicineId(medicine.id);
    setDoseLabel(medicine.dose || DOSE_OPTIONS[0]);
    setMedicineDropdownOpen(false);
  };

  const cycleDose = () => {
    if (selectedMedicine?.dose) {
      setDoseLabel(selectedMedicine.dose);
      return;
    }

    const currentIndex = DOSE_OPTIONS.indexOf(doseLabel);
    const nextIndex = (currentIndex + 1 + DOSE_OPTIONS.length) % DOSE_OPTIONS.length;
    setDoseLabel(DOSE_OPTIONS[nextIndex]);
  };

  const handleSave = async () => {
    if (!selectedMedicineId) {
      Alert.alert('Нет лекарства', 'Сначала добавь лекарство в инвентарь.');
      return;
    }

    if (!time.trim()) {
      Alert.alert('Нет времени', 'Укажи время уведомления.');
      return;
    }

    if (!Object.values(selectedDays).some(Boolean)) {
      Alert.alert('Нет дней', 'Выбери хотя бы один день приема.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('medicine_schedules').insert([
        {
          user_id: user.id,
          medicine_id: selectedMedicineId,
          time,
          days: selectedDays
        }
      ]);

      if (error) {
        throw error;
      }

      onCreated?.();
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить уведомление.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.headerIcon} onPress={onBack}>
            <Ionicons name="chevron-back" size={30} color={colors.darkText} />
          </Pressable>
          <Text style={styles.title}>Добавление уведомления</Text>
          <Pressable style={styles.headerIcon} onPress={onBack}>
            <Ionicons name="close" size={30} color="#5A82FF" />
          </Pressable>
        </View>

        <Text style={styles.monthTitle}>
          {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
        </Text>

        <View style={styles.weekRow}>
          {weekDays.map((date) => {
            const active = sameDate(date, selectedDate);
            return (
              <Pressable key={formatStorageDate(date)} style={styles.dayCell} onPress={() => setSelectedDate(date)}>
                <Text style={[styles.dayName, active && styles.dayNameActive]}>{DAY_SHORT[date.getDay()]}</Text>
                <View style={[styles.dayBubble, active && styles.dayBubbleActive]}>
                  <Text style={[styles.dayNumber, active && styles.dayNumberActive]}>{date.getDate()}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Название</Text>
          <Pressable
            style={[styles.select, styles.medicineSelect]}
            onPress={() => setMedicineDropdownOpen((current) => !current)}
          >
            <Text style={[styles.inputText, !selectedMedicine && styles.placeholderText]}>
              {selectedMedicine?.name || 'Сначала добавьте лекарство'}
            </Text>
            <Ionicons
              name={medicineDropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={colors.darkText}
            />
          </Pressable>

          {medicineDropdownOpen ? (
            <View style={styles.dropdownMenu}>
              {medicines.length ? (
                medicines.map((medicine) => {
                  const active = medicine.id === selectedMedicineId;
                  return (
                    <Pressable
                      key={String(medicine.id)}
                      style={[styles.dropdownItem, active && styles.dropdownItemActive]}
                      onPress={() => selectMedicine(medicine)}
                    >
                      <Text style={[styles.dropdownItemText, active && styles.dropdownItemTextActive]}>
                        {medicine.name}
                      </Text>
                    </Pressable>
                  );
                })
              ) : (
                <View style={styles.dropdownEmpty}>
                  <Text style={styles.dropdownEmptyText}>Список лекарств пуст</Text>
                </View>
              )}
            </View>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Дни приема</Text>
          <View style={styles.daysPicker}>
            {DAY_LABELS.map((day) => {
              const active = selectedDays[day.key];
              return (
                <Pressable
                  key={day.key}
                  style={[styles.dayChip, active && styles.dayChipActive]}
                  onPress={() =>
                    setSelectedDays((current) => ({
                      ...current,
                      [day.key]: !current[day.key]
                    }))
                  }
                >
                  <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>{day.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Время</Text>
          <View style={styles.singleIconRow}>
            <TextInput
              value={time}
              onChangeText={setTime}
              placeholder="8.00"
              placeholderTextColor="#CDD1DA"
              style={[styles.input, styles.timeInput]}
            />
            <Ionicons name="time-outline" size={28} color={colors.darkText} />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Дозировка</Text>
          <Pressable style={styles.select} onPress={cycleDose}>
            <Text style={styles.inputText}>{doseLabel}</Text>
            <Ionicons name="chevron-down" size={28} color={colors.darkText} />
          </Pressable>
        </View>

        <Pressable style={styles.primaryButton} onPress={handleSave} disabled={saving}>
          <Text style={styles.primaryButtonText}>{saving ? 'Сохранение...' : 'Сохранить'}</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => {
            setSelectedDate(new Date());
            setTime('08:00');
            setDoseLabel(selectedMedicine?.dose || DOSE_OPTIONS[0]);
            setSelectedDays({
              mon: true,
              tue: true,
              wed: true,
              thu: true,
              fri: true,
              sat: false,
              sun: false
            });
          }}
        >
          <Text style={styles.secondaryButtonText}>Очистить</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF'
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 34
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    flex: 1,
    marginHorizontal: 12,
    color: colors.darkText,
    fontSize: 20,
    fontWeight: '800'
  },
  monthTitle: {
    marginTop: 22,
    color: colors.darkText,
    fontSize: 24,
    fontWeight: '800'
  },
  weekRow: {
    marginTop: 24,
    marginBottom: 26,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  dayCell: {
    alignItems: 'center',
    width: 46
  },
  dayName: {
    color: colors.darkText,
    fontSize: 14,
    marginBottom: 8
  },
  dayNameActive: {
    color: colors.accent
  },
  dayBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dayBubbleActive: {
    backgroundColor: '#38BFD1',
    shadowColor: '#38BFD1',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6
  },
  dayNumber: {
    color: colors.darkText,
    fontSize: 18,
    fontWeight: '500'
  },
  dayNumberActive: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  field: {
    marginBottom: 18
  },
  label: {
    marginBottom: 10,
    color: colors.darkText,
    fontSize: 17,
    fontWeight: '800'
  },
  input: {
    minHeight: 58,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E6E7ED',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingHorizontal: 18
  },
  inputText: {
    color: colors.darkText,
    fontSize: 16
  },
  placeholderText: {
    color: '#CDD1DA'
  },
  daysPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  dayChip: {
    width: 54,
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E6E7ED',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  dayChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent
  },
  dayChipText: {
    color: colors.darkText,
    fontSize: 16,
    fontWeight: '700'
  },
  dayChipTextActive: {
    color: '#FFFFFF'
  },
  singleIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  timeInput: {
    flex: 1
  },
  select: {
    minHeight: 58,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E6E7ED',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  medicineSelect: {
    marginBottom: 8
  },
  dropdownMenu: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E6E7ED',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden'
  },
  dropdownItem: {
    minHeight: 50,
    paddingHorizontal: 18,
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F3F7'
  },
  dropdownItemActive: {
    backgroundColor: '#EEF8FA'
  },
  dropdownItemText: {
    color: colors.darkText,
    fontSize: 15
  },
  dropdownItemTextActive: {
    color: colors.accent,
    fontWeight: '700'
  },
  dropdownEmpty: {
    minHeight: 50,
    paddingHorizontal: 18,
    justifyContent: 'center'
  },
  dropdownEmptyText: {
    color: colors.darkMuted,
    fontSize: 14
  },
  primaryButton: {
    marginTop: 18,
    minHeight: 58,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500'
  },
  secondaryButton: {
    marginTop: 18,
    alignItems: 'center'
  },
  secondaryButtonText: {
    color: colors.darkText,
    fontSize: 18,
    fontWeight: '400'
  }
});

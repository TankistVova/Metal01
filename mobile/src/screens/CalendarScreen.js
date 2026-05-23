import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const formatDate = (date) => {
  if (!date) {
    return '';
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const getDaysInMonth = (currentMonth) => {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) {
    startOffset = 6;
  }

  const days = [];
  for (let index = 0; index < startOffset; index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(year, month, day));
  }

  return days;
};

export function CalendarScreen({ user, onOpenAdd }) {
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [today] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);
    await Promise.all([loadSchedules(), loadLogs()]);
    setLoading(false);
  };

  const loadSchedules = async () => {
    const { data } = await supabase
      .from('medicine_schedules')
      .select('*, medicines(name, icon)')
      .eq('user_id', user.id);

    setSchedules(data || []);
  };

  const loadLogs = async () => {
    const { data } = await supabase
      .from('medicine_logs')
      .select('*')
      .eq('user_id', user.id);

    setLogs(data || []);
  };

  const getSchedulesForDate = (date) => {
    const dayKey = DAY_KEYS[date.getDay() === 0 ? 6 : date.getDay() - 1];
    return schedules.filter((schedule) => schedule.days?.[dayKey]);
  };

  const isTaken = (scheduleId, dateStr) => logs.some((log) => log.schedule_id === scheduleId && log.date === dateStr);

  const toggleLog = async (scheduleId, dateStr) => {
    const existing = logs.find((log) => log.schedule_id === scheduleId && log.date === dateStr);

    if (existing) {
      await supabase.from('medicine_logs').delete().eq('id', existing.id);
    } else {
      await supabase.from('medicine_logs').insert([
        {
          user_id: user.id,
          schedule_id: scheduleId,
          date: dateStr,
          taken: true
        }
      ]);
    }

    await loadLogs();
  };

  const handleDeleteSchedule = async (id) => {
    await supabase.from('medicine_schedules').delete().eq('id', id);
    await loadSchedules();
  };

  const days = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);
  const selectedDateSchedules = useMemo(() => getSchedulesForDate(selectedDate), [selectedDate, schedules]);
  const selectedDateStr = formatDate(selectedDate);

  const isToday = (date) => date && formatDate(date) === formatDate(today);
  const isSelected = (date) => date && formatDate(date) === formatDate(selectedDate);
  const hasSchedule = (date) => date && getSchedulesForDate(date).length > 0;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.calendarHeader}>
        <Pressable
          style={styles.navButton}
          onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
        >
          <Ionicons name="chevron-back" size={20} color="#555555" />
        </Pressable>

        <Text style={styles.monthTitle}>
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Text>

        <Pressable
          style={styles.navButton}
          onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
        >
          <Ionicons name="chevron-forward" size={20} color="#555555" />
        </Pressable>
      </View>

      <View style={styles.grid}>
        {DAYS.map((day) => (
          <Text key={day} style={styles.dayName}>{day}</Text>
        ))}

        {days.map((date, index) => (
          <Pressable
            key={`${formatDate(date)}-${index}`}
            style={[
              styles.dayCell,
              !date && styles.dayCellEmpty,
              isToday(date) && styles.dayCellToday,
              isSelected(date) && styles.dayCellSelected
            ]}
            onPress={() => date && setSelectedDate(date)}
            disabled={!date}
          >
            <Text
              style={[
                styles.dayNumber,
                isToday(date) && styles.dayNumberToday,
                isSelected(date) && styles.dayNumberSelected
              ]}
            >
              {date ? date.getDate() : ''}
            </Text>
            {hasSchedule(date) ? <View style={[styles.dot, isSelected(date) && styles.dotSelected]} /> : null}
          </Pressable>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Расписание приёма</Text>
        <Pressable style={styles.addButton} onPress={onOpenAdd}>
          <Text style={styles.addButtonText}>+ Добавить</Text>
        </Pressable>
      </View>

      {schedules.length === 0 ? (
        <Text style={styles.emptyText}>Нет расписаний. Добавьте первое!</Text>
      ) : (
        schedules.map((schedule) => (
          <View key={String(schedule.id)} style={styles.scheduleItem}>
            <Text style={styles.scheduleIcon}>{schedule.medicines?.icon || '💊'}</Text>
            <View style={styles.scheduleInfo}>
              <Text style={styles.scheduleName}>{schedule.medicines?.name}</Text>
              <Text style={styles.scheduleTime}>
                {schedule.time} · {DAY_KEYS.filter((key) => schedule.days?.[key]).map((key) => DAYS[DAY_KEYS.indexOf(key)]).join(', ')}
              </Text>
            </View>
            <Pressable onPress={() => handleDeleteSchedule(schedule.id)} hitSlop={8}>
              <Text style={styles.deleteText}>×</Text>
            </Pressable>
          </View>
        ))
      )}

      <View style={styles.daySection}>
        <Text style={styles.dayTitle}>
          {selectedDate.getDate()} {MONTHS[selectedDate.getMonth()]}{isToday(selectedDate) ? ' — Сегодня' : ''}
        </Text>

        {selectedDateSchedules.length === 0 ? (
          <Text style={styles.emptyText}>На этот день приёмов нет</Text>
        ) : (
          selectedDateSchedules.map((schedule) => {
            const taken = isTaken(schedule.id, selectedDateStr);

            return (
              <View key={String(schedule.id)} style={[styles.dayMedCard, taken && styles.dayMedCardTaken]}>
                <Text style={styles.dayMedIcon}>{schedule.medicines?.icon || '💊'}</Text>
                <View style={styles.dayMedInfo}>
                  <Text style={styles.dayMedName}>{schedule.medicines?.name}</Text>
                  <Text style={styles.dayMedTime}>{schedule.time}</Text>
                </View>
                <Pressable
                  style={[styles.takenButton, taken && styles.takenButtonActive]}
                  onPress={() => toggleLog(schedule.id, selectedDateStr)}
                >
                  <Text style={[styles.takenButtonText, taken && styles.takenButtonTextActive]}>
                    {taken ? '✓ Принято' : 'Принять'}
                  </Text>
                </Pressable>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 24
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF'
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  monthTitle: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: '600'
  },
  navButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF'
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24
  },
  dayName: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#AAAAAA',
    paddingVertical: 6
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    position: 'relative',
    gap: 2
  },
  dayCellEmpty: {
    opacity: 0
  },
  dayCellToday: {
    backgroundColor: '#E6F7F9'
  },
  dayCellSelected: {
    backgroundColor: '#30BACB'
  },
  dayNumber: {
    color: '#333333',
    fontSize: 14
  },
  dayNumberToday: {
    color: '#30BACB',
    fontWeight: '600'
  },
  dayNumberSelected: {
    color: '#FFFFFF',
    fontWeight: '600'
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#30BACB'
  },
  dotSelected: {
    backgroundColor: 'rgba(255,255,255,0.8)'
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  sectionTitle: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '600'
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: '#30BACB',
    borderRadius: 20
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13
  },
  emptyText: {
    color: '#AAAAAA',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 10
  },
  scheduleIcon: {
    fontSize: 22
  },
  scheduleInfo: {
    flex: 1
  },
  scheduleName: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '500'
  },
  scheduleTime: {
    color: '#888888',
    fontSize: 12,
    marginTop: 2
  },
  deleteText: {
    color: '#CCCCCC',
    fontSize: 22,
    lineHeight: 22
  },
  daySection: {
    marginTop: 14,
    gap: 14
  },
  dayTitle: {
    color: '#1A1A1A',
    fontSize: 22,
    fontWeight: '700'
  },
  dayMedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 14,
    backgroundColor: '#FFFFFF'
  },
  dayMedCardTaken: {
    backgroundColor: '#F0FAFB',
    borderColor: '#B2E4EA'
  },
  dayMedIcon: {
    fontSize: 26
  },
  dayMedInfo: {
    flex: 1
  },
  dayMedName: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '500'
  },
  dayMedTime: {
    color: '#888888',
    fontSize: 13,
    marginTop: 3
  },
  takenButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF'
  },
  takenButtonActive: {
    backgroundColor: '#30BACB',
    borderColor: '#30BACB'
  },
  takenButtonText: {
    color: '#555555',
    fontSize: 13
  },
  takenButtonTextActive: {
    color: '#FFFFFF'
  }
});

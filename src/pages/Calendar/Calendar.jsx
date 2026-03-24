import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import AuthHeader from '../../components/AuthHeader';
import Footer from '../../components/Footer';
import LoadingScreen from '../../components/LoadingScreen';
import { requestNotificationPermission, sendSchedulesToSW, initNotifications, refreshNotifications } from '../../swUtils';
import './Calendar.css';

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const DAY_KEYS = ['mon','tue','wed','thu','fri','sat','sun'];

function Calendar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [today] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    medicine_id: '', time: '08:00',
    days: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false }
  });

  useEffect(() => {
    init();
    // Обработка нажатия "Принял" из push-уведомления
    const handleSWMessage = async (event) => {
      if (event.data?.type === 'MARK_TAKEN') {
        const scheduleId = event.data.scheduleId;
        const dateStr = new Date().toISOString().split('T')[0];
        const existing = logs.find(l => l.schedule_id === scheduleId && l.date === dateStr);
        if (!existing) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          await supabase.from('medicine_logs').insert([{ user_id: user.id, schedule_id: scheduleId, date: dateStr, taken: true }]);
          const schedule = schedules.find(s => s.id === scheduleId);
          if (schedule) {
            await supabase.from('notifications').insert([{
              user_id: user.id,
              type: 'medicine_taken',
              title: 'Приём лекарства',
              message: `Вы приняли ${schedule.medicines?.name || 'лекарство'} в ${schedule.time}`,
              is_read: false
            }]);
          }
          await loadLogs(user.id);
        }
      }

      if (event.data?.type === 'MEDICINE_REMINDER') {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase.from('notifications').insert([{
          user_id: user.id,
          type: 'medicine_taken',
          title: 'Напоминание о приёме',
          message: `Время принять ${event.data.medicineName} — ${event.data.time}`,
          is_read: false
        }]);
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleSWMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
  }, []);

  useEffect(() => {
    document.body.style.overflow = showAddModal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showAddModal]);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/login'); return; }
    setUser(user);
    await Promise.all([loadMedicines(user.id), loadSchedules(user.id), loadLogs(user.id)]);
    setLoading(false);
  };

  const loadMedicines = async (userId) => {
    const { data: owned } = await supabase.from('aptechkas').select('id').eq('owner_id', userId);
    const { data: memberRows } = await supabase.from('aptechka_members').select('aptechka_id').eq('user_id', userId);
    const ids = [
      ...(owned?.map(a => a.id) || []),
      ...(memberRows?.map(m => m.aptechka_id) || [])
    ];
    if (!ids.length) return;
    const { data } = await supabase.from('medicines').select('*').in('aptechka_id', ids);
    setMedicines(data || []);
  };

  const loadSchedules = async (userId) => {
    const { data } = await supabase.from('medicine_schedules').select('*, medicines(name, icon)').eq('user_id', userId);
    setSchedules(data || []);
  };

  const loadLogs = async (userId) => {
    const { data } = await supabase.from('medicine_logs').select('*').eq('user_id', userId);
    setLogs(data || []);
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    if (!newSchedule.medicine_id) return;
    const { error } = await supabase.from('medicine_schedules').insert([{
      user_id: user.id,
      medicine_id: newSchedule.medicine_id,
      time: newSchedule.time,
      days: newSchedule.days
    }]);
    if (!error) {
      setShowAddModal(false);
      setNewSchedule({ medicine_id: '', time: '08:00', days: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false } });
      await loadSchedules(user.id);
      await refreshNotifications(user.id, supabase);
    }
  };

  const handleDeleteSchedule = async (id) => {
    await supabase.from('medicine_schedules').delete().eq('id', id);
    await loadSchedules(user.id);
    await refreshNotifications(user.id, supabase);
  };

  const toggleLog = async (scheduleId, dateStr) => {
    const existing = logs.find(l => l.schedule_id === scheduleId && l.date === dateStr);
    if (existing) {
      await supabase.from('medicine_logs').delete().eq('id', existing.id);
    } else {
      await supabase.from('medicine_logs').insert([{ user_id: user.id, schedule_id: scheduleId, date: dateStr, taken: true }]);
      const schedule = schedules.find(s => s.id === scheduleId);
      if (schedule) {
        await supabase.from('notifications').insert([{
          user_id: user.id,
          type: 'medicine_taken',
          title: 'Приём лекарства',
          message: `Вы приняли ${schedule.medicines?.name || 'лекарство'} в ${schedule.time}`,
          is_read: false
        }]);
      }
    }
    await loadLogs(user.id);
  };

  const isTaken = (scheduleId, dateStr) => logs.some(l => l.schedule_id === scheduleId && l.date === dateStr);

  const getSchedulesForDate = (date) => {
    const dayKey = DAY_KEYS[date.getDay() === 0 ? 6 : date.getDay() - 1];
    return schedules.filter(s => s.days?.[dayKey]);
  };

  // Генерация дней месяца
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    // Смещение: пн=0
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;
    const days = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  };

  const formatDate = (date) => {
    if (!date) return '';
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  };

  const isToday = (date) => date && formatDate(date) === formatDate(today);
  const isSelected = (date) => date && formatDate(date) === formatDate(selectedDate);
  const hasSchedule = (date) => date && getSchedulesForDate(date).length > 0;

  const selectedDateSchedules = getSchedulesForDate(selectedDate);
  const selectedDateStr = formatDate(selectedDate);

  if (loading) return <LoadingScreen />;

  return (
    <>
      <AuthHeader />
      <div className="calendar-page">
        <div className="calendar-container">

          {/* Левая часть — календарь */}
          <div className="calendar-left">
            <div className="calendar-header">
              <button className="cal-nav-btn" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>‹</button>
              <span className="cal-month-title">{MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
              <button className="cal-nav-btn" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>›</button>
            </div>

            <div className="cal-grid">
              {DAYS.map(d => <div key={d} className="cal-day-name">{d}</div>)}
              {getDaysInMonth().map((date, i) => (
                <div
                  key={i}
                  className={`cal-day ${!date ? 'empty' : ''} ${isToday(date) ? 'today' : ''} ${isSelected(date) ? 'selected' : ''} ${hasSchedule(date) ? 'has-schedule' : ''}`}
                  onClick={() => date && setSelectedDate(date)}
                >
                  {date ? date.getDate() : ''}
                  {hasSchedule(date) && <span className="cal-dot" />}
                </div>
              ))}
            </div>

            {/* Список расписаний */}
            <div className="schedules-list">
              <div className="schedules-list-header">
                <h3>Расписание приёма</h3>
                <button className="btn-add-schedule" onClick={() => setShowAddModal(true)}>+ Добавить</button>
              </div>
              {schedules.length === 0
                ? <p className="no-schedules">Нет расписаний. Добавьте первое!</p>
                : schedules.map(s => (
                  <div key={s.id} className="schedule-item">
                    <span className="schedule-icon">{s.medicines?.icon || '💊'}</span>
                    <div className="schedule-info">
                      <span className="schedule-name">{s.medicines?.name}</span>
                      <span className="schedule-time">{s.time} · {DAY_KEYS.filter(k => s.days?.[k]).map(k => DAYS[DAY_KEYS.indexOf(k)]).join(', ')}</span>
                    </div>
                    <button className="schedule-delete" onClick={() => handleDeleteSchedule(s.id)}>×</button>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Правая часть — день */}
          <div className="calendar-right">
            <h2 className="day-title">
              {selectedDate.getDate()} {MONTHS[selectedDate.getMonth()]}{isToday(selectedDate) ? ' — Сегодня' : ''}
            </h2>
            {selectedDateSchedules.length === 0
              ? <p className="no-meds-today">На этот день приёмов нет</p>
              : selectedDateSchedules.map(s => {
                const taken = isTaken(s.id, selectedDateStr);
                return (
                  <div key={s.id} className={`day-med-card ${taken ? 'taken' : ''}`}>
                    <span className="day-med-icon">{s.medicines?.icon || '💊'}</span>
                    <div className="day-med-info">
                      <span className="day-med-name">{s.medicines?.name}</span>
                      <span className="day-med-time">{s.time}</span>
                    </div>
                    <button
                      className={`btn-taken ${taken ? 'active' : ''}`}
                      onClick={() => toggleLog(s.id, selectedDateStr)}
                    >
                      {taken ? '✓ Принято' : 'Принять'}
                    </button>
                  </div>
                );
              })
            }
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content cal-modal" onClick={e => e.stopPropagation()}>
            <button className="am-modal-close" onClick={() => setShowAddModal(false)}>×</button>
            <h2 className="add-modal-title">Добавить расписание</h2>
            <form onSubmit={handleAddSchedule} className="add-medicine-form">
              <div className="am-field">
                <label>Лекарство</label>
                <div className="am-select-wrap">
                  <select value={newSchedule.medicine_id} onChange={e => setNewSchedule({...newSchedule, medicine_id: e.target.value})} required>
                    <option value="">Выберите лекарство</option>
                    {medicines.map(m => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="am-field">
                <label>Время приёма</label>
                <input type="time" value={newSchedule.time} onChange={e => setNewSchedule({...newSchedule, time: e.target.value})} required />
              </div>
              <div className="am-field">
                <label>Дни недели</label>
                <div className="days-picker">
                  {DAY_KEYS.map((key, i) => (
                    <button
                      key={key}
                      type="button"
                      className={`day-btn ${newSchedule.days[key] ? 'active' : ''}`}
                      onClick={() => setNewSchedule({...newSchedule, days: {...newSchedule.days, [key]: !newSchedule.days[key]}})}
                    >
                      {DAYS[i]}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="am-btn-submit">Сохранить</button>
              <button type="button" className="am-btn-cancel" onClick={() => setShowAddModal(false)}>Отмена</button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

export default Calendar;

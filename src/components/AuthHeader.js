import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import logo from '../asset/logo.svg';
import mailIcon from '../asset/icons/icon-mail-reg.png';
import './AuthHeader.css';
import { useState, useEffect } from 'react';
import { initNotifications } from '../swUtils';

function AuthHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [inviteCount, setInviteCount] = useState(0);
  const [prevInviteCount, setPrevInviteCount] = useState(0);
  const [medicineCount, setMedicineCount] = useState(0);
  const [prevMedicineCount, setPrevMedicineCount] = useState(0);
  const [navOpen, setNavOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  useEffect(() => {
    loadInviteCount();
    loadMedicineCount();
    requestNotificationPermission();
    initScheduledNotifications();

    const handleSWMessage = async (event) => {
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
        return;
      }

      if (event.data?.type === 'PUSH_SUBSCRIPTION_CHANGE') {
        await initScheduledNotifications();
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleSWMessage);

    const interval = setInterval(() => {
      checkNewInvites();
      checkNewMedicines();
      checkNewNotifications();
    }, 10000);
    return () => {
      clearInterval(interval);
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
    };
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const initScheduledNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await initNotifications(user.id, supabase);
  };

  const checkNewInvites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('aptechka_invites')
        .select('id', { count: 'exact' })
        .eq('invited_email', user.email)
        .eq('status', 'pending');

      if (error) return;

      const newCount = data?.length || 0;
      
      if (newCount > prevInviteCount && prevInviteCount > 0 && Notification.permission === 'granted') {
        new Notification('Новое приглашение', {
          body: 'Вы получили приглашение в аптечку',
          icon: '/logo192.png'
        });
      }
      
      setPrevInviteCount(newCount);
      setInviteCount(newCount);
    } catch (err) {
      console.error('Error checking invites:', err);
    }
  };

  const loadInviteCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('aptechka_invites')
      .select('id', { count: 'exact' })
      .eq('invited_email', user.email)
      .eq('status', 'pending');

    if (data) {
      const count = data.length;
      setInviteCount(count);
      setPrevInviteCount(count);
    }
  };

  const loadMedicineCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: aptechkas } = await supabase
        .from('aptechkas')
        .select('id')
        .or(`owner_id.eq.${user.id}`);

      const { data: memberAptechkas } = await supabase
        .from('aptechka_members')
        .select('aptechka_id')
        .eq('user_id', user.id);

      const aptechkaIds = [
        ...(aptechkas?.map(a => a.id) || []),
        ...(memberAptechkas?.map(m => m.aptechka_id) || [])
      ];

      if (aptechkaIds.length > 0) {
        const { data } = await supabase
          .from('medicines')
          .select('id', { count: 'exact' })
          .in('aptechka_id', aptechkaIds);

        const count = data?.length || 0;
        setMedicineCount(count);
        setPrevMedicineCount(count);
      }
    } catch (err) {
      console.error('Error loading medicine count:', err);
    }
  };

  const checkNewMedicines = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: aptechkas } = await supabase
        .from('aptechkas')
        .select('id')
        .or(`owner_id.eq.${user.id}`);

      const { data: memberAptechkas } = await supabase
        .from('aptechka_members')
        .select('aptechka_id')
        .eq('user_id', user.id);

      const aptechkaIds = [
        ...(aptechkas?.map(a => a.id) || []),
        ...(memberAptechkas?.map(m => m.aptechka_id) || [])
      ];

      if (aptechkaIds.length > 0) {
        const { data, error } = await supabase
          .from('medicines')
          .select('id', { count: 'exact' })
          .in('aptechka_id', aptechkaIds);

        if (error) {
          console.error('Medicine check error:', error);
          return;
        }

        const newCount = data?.length || 0;

        if (newCount > prevMedicineCount && prevMedicineCount > 0 && Notification.permission === 'granted') {
          new Notification('Новое лекарство', {
            body: 'В аптечку добавлено новое лекарство',
            icon: '/logo192.png'
          });
        }

        setPrevMedicineCount(newCount);
        setMedicineCount(newCount);
      }
    } catch (err) {
      console.error('Error checking medicines:', err);
    }
  };

  const checkNewNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('notifications')
        .select('id, title, message, is_read')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!data?.length) return;

      const stored = JSON.parse(localStorage.getItem('shownNotifIds') || '[]');
      const newOnes = data.filter(n => !stored.includes(n.id));

      if (newOnes.length > 0 && Notification.permission === 'granted') {
        newOnes.forEach(n => {
          new Notification(n.title, {
            body: n.message,
            icon: '/logo192.png'
          });
        });
        const updatedStored = [...stored, ...newOnes.map(n => n.id)].slice(-50);
        localStorage.setItem('shownNotifIds', JSON.stringify(updatedStored));
      }
    } catch (err) {
      console.error('Error checking notifications:', err);
    }
  };

  return (
    <header className="auth-header">
      <div className="auth-header-container">
        <div className="logo" onClick={() => navigate('/')}>
          <img src={logo} alt="Цифровая аптечка" />
        </div>
        <nav className={`auth-nav${navOpen ? ' open' : ''}`}>
          <button 
            className={location.pathname === '/inventory' ? 'active' : ''} 
            onClick={() => { navigate('/inventory'); setNavOpen(false); }}
          >
            Инвентарь
          </button>
          <button 
            className={location.pathname === '/calendar' ? 'active' : ''} 
            onClick={() => { navigate('/calendar'); setNavOpen(false); }}
          >
            Календарь уведомлений
          </button>
          <button className="nav-mobile-invites" onClick={() => { navigate('/invites'); setNavOpen(false); }}>
            Уведомления {inviteCount > 0 && <span className="nav-badge">{inviteCount}</span>}
          </button>
          <button 
            className={`nav-mobile-profile ${location.pathname === '/profile' ? 'active' : ''}`}
            onClick={() => { navigate('/profile'); setNavOpen(false); }}
          >
            Мой профиль
          </button>
        </nav>
        <div className="header-actions">
          <button 
            className="btn-notifications"
            onClick={() => navigate('/invites')}
          >
            <img src={mailIcon} alt="Уведомления" />
            {inviteCount > 0 && <span className="notification-badge">{inviteCount}</span>}
          </button>
          <button 
            className={`btn-profile ${location.pathname === '/profile' ? 'active' : ''}`}
            onClick={() => navigate('/profile')}
          >
            Мой профиль
          </button>
        </div>
        <button className="auth-hamburger" onClick={() => setNavOpen(o => !o)}>☰</button>
      </div>
    </header>
  );
}

export default AuthHeader;

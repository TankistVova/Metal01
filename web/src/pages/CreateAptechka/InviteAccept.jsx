import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import './InviteAccept.css';
import AuthHeader from '../../components/AuthHeader';
import LoadingScreen from '../../components/LoadingScreen';
import { FaBell, FaEnvelopeOpenText, FaCheckCircle, FaTimesCircle, FaClock, FaCheckDouble } from 'react-icons/fa';
import { MdOutlineMarkEmailRead } from 'react-icons/md';

const InviteAccept = () => {
  const [invites, setInvites] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('invites');
  const navigate = useNavigate();

  useEffect(() => {
    loadUserInvites();
    loadNotifications();
  }, []);

  // При переключении на вкладку активности — помечаем все как прочитанные
  useEffect(() => {
    if (activeTab === 'activity') {
      markAllRead();
    }
  }, [activeTab]);

  const loadUserInvites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('aptechka_invites')
        .select('*')
        .eq('invited_email', user.email)
        .eq('status', 'pending');
      setInvites(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setNotifications(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const unread = notifications.filter(n => !n.is_read).map(n => n.id);
      if (unread.length === 0) return;
      await supabase.from('notifications').update({ is_read: true }).in('id', unread);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const markOneRead = async (id) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const acceptInvite = async (inviteId, aptechkaId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('aptechka_members').insert([{ aptechka_id: aptechkaId, user_id: user.id, role: 'member' }]);
      await supabase.from('aptechka_invites').update({ status: 'accepted' }).eq('id', inviteId);
      navigate('/inventory');
    } catch (err) {
      console.error(err);
    }
  };

  const declineInvite = async (inviteId) => {
    try {
      await supabase.from('aptechka_invites').update({ status: 'declined' }).eq('id', inviteId);
      loadUserInvites();
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'только что';
    if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  if (loading) return <LoadingScreen />;

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const totalCount = invites.length + unreadCount;

  return (
    <>
      <AuthHeader />
      <div className="notif-page">
        <div className="notif-container">

          {/* Заголовок */}
          <div className="notif-header">
            <div className="notif-header-left">
              <div className="notif-header-icon"><FaBell /></div>
              <div>
                <h1>Уведомления</h1>
                <p>{totalCount > 0 ? `${totalCount} непрочитанных` : 'Все уведомления прочитаны'}</p>
              </div>
            </div>
            {activeTab === 'activity' && unreadCount > 0 && (
              <button className="notif-mark-all" onClick={markAllRead}>
                <FaCheckDouble /> Прочитать все
              </button>
            )}
          </div>

          {/* Табы */}
          <div className="notif-tabs">
            <button
              className={`notif-tab ${activeTab === 'invites' ? 'active' : ''}`}
              onClick={() => setActiveTab('invites')}
            >
              <FaEnvelopeOpenText />
              Приглашения
              {invites.length > 0 && <span className="notif-tab-badge">{invites.length}</span>}
            </button>
            <button
              className={`notif-tab ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              <FaClock />
              Активность
              {unreadCount > 0 && <span className="notif-tab-badge">{unreadCount}</span>}
            </button>
          </div>

          {/* Приглашения */}
          {activeTab === 'invites' && (
            <div className="notif-list">
              {invites.length === 0 ? (
                <div className="notif-empty">
                  <MdOutlineMarkEmailRead className="notif-empty-icon" />
                  <h3>Нет новых приглашений</h3>
                  <p>Когда кто-то пригласит вас в аптечку, приглашение появится здесь</p>
                </div>
              ) : (
                invites.map(invite => (
                  <div key={invite.id} className="notif-card invite-card">
                    <div className="notif-card-icon invite-icon">
                      <FaEnvelopeOpenText />
                    </div>
                    <div className="notif-card-body">
                      <div className="notif-card-top">
                        <h3>Приглашение в аптечку</h3>
                        <span className="notif-time">{formatTime(invite.created_at)}</span>
                      </div>
                      <p>Вас пригласили присоединиться к общей аптечке</p>
                      <div className="invite-btns">
                        <button className="btn-accept" onClick={() => acceptInvite(invite.id, invite.aptechka_id)}>
                          <FaCheckCircle /> Принять
                        </button>
                        <button className="btn-decline" onClick={() => declineInvite(invite.id)}>
                          <FaTimesCircle /> Отклонить
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Активность */}
          {activeTab === 'activity' && (
            <div className="notif-list">
              {notifications.length === 0 ? (
                <div className="notif-empty">
                  <FaBell className="notif-empty-icon" />
                  <h3>Нет активности</h3>
                  <p>Здесь будут отображаться последние действия в ваших аптечках</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`notif-card activity-card ${!notif.is_read ? 'unread' : ''}`}
                    onClick={() => !notif.is_read && markOneRead(notif.id)}
                  >
                    <div className="notif-card-icon activity-icon">
                      <FaBell />
                    </div>
                    <div className="notif-card-body">
                      <div className="notif-card-top">
                        <h3>{notif.title}</h3>
                        <div className="notif-card-top-right">
                          <span className="notif-time">{formatTime(notif.created_at)}</span>
                          {!notif.is_read && <span className="notif-unread-dot" />}
                        </div>
                      </div>
                      <p>{notif.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default InviteAccept;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import './InviteAccept.css';

const InviteAccept = () => {
  const [invites, setInvites] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserInvites();
    loadNotifications();
  }, []);

  const loadUserInvites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('aptechka_invites')
        .select('*')
        .eq('invited_email', user.email)
        .eq('status', 'pending');

      if (error) {
        console.error('Error:', error);
        throw error;
      }
      
      setInvites(data || []);
    } catch (error) {
      console.error('Ошибка загрузки приглашений:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error) {
        setNotifications(data || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error);
    }
  };

  const acceptInvite = async (inviteId, aptechkaId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: memberError } = await supabase
        .from('aptechka_members')
        .insert([
          {
            aptechka_id: aptechkaId,
            user_id: user.id,
            role: 'member'
          }
        ]);

      if (memberError) throw memberError;

      const { error: inviteError } = await supabase
        .from('aptechka_invites')
        .update({ status: 'accepted' })
        .eq('id', inviteId);

      if (inviteError) throw inviteError;

      alert('Приглашение принято!');
      navigate('/inventory');
    } catch (error) {
      console.error('Ошибка принятия приглашения:', error);
      alert('Ошибка при принятии приглашения');
    }
  };

  const declineInvite = async (inviteId) => {
    try {
      const { error } = await supabase
        .from('aptechka_invites')
        .update({ status: 'declined' })
        .eq('id', inviteId);

      if (error) throw error;
      loadUserInvites();
    } catch (error) {
      console.error('Ошибка отклонения приглашения:', error);
    }
  };

  const getAvatarIcon = (avatar) => {
    const avatarMap = {
      home: '🏠',
      travel: '✈️',
      kids: '👶',
      car: '🚗',
      work: '💼',
      sport: '⚽'
    };
    return avatarMap[avatar] || '🏠';
  };

  if (loading) {
    return <div className="invite-accept-loading">Загрузка...</div>;
  }

  if (invites.length === 0 && notifications.length === 0) {
    return (
      <div className="invite-accept-empty">
        <h2>У вас нет уведомлений</h2>
        <p>Когда кто-то пригласит вас в аптечку или добавит лекарство, уведомления появятся здесь</p>
      </div>
    );
  }

  return (
    <div className="invite-accept">
      <div className="invite-accept-container">
        <h1>Уведомления</h1>
        
        {invites.length > 0 && (
          <>
            <h2>Приглашения в аптечки ({invites.length})</h2>
            <div className="invites-list">
              {invites.map(invite => (
                <div key={invite.id} className="invite-card">
                  <div className="invite-header">
                    <div className="invite-info">
                      <h3>Приглашение в аптечку</h3>
                      <p className="invite-from">
                        Email: {invite.invited_email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="invite-actions">
                    <button
                      onClick={() => acceptInvite(invite.id, invite.aptechka_id)}
                      className="btn-accept"
                    >
                      Принять
                    </button>
                    <button
                      onClick={() => declineInvite(invite.id)}
                      className="btn-decline"
                    >
                      Отклонить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {notifications.length > 0 && (
          <>
            <h2 style={{marginTop: '30px'}}>Последние действия</h2>
            <div className="notifications-list">
              {notifications.map(notif => (
                <div key={notif.id} className="notification-card">
                  <div className="notification-content">
                    <h4>{notif.title}</h4>
                    <p>{notif.message}</p>
                    <span className="notification-time">
                      {new Date(notif.created_at).toLocaleString('ru-RU')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InviteAccept;
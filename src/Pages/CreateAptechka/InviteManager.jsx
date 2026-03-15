import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './InviteManager.css';

const InviteManager = ({ aptechkaId, onClose }) => {
  const [invites, setInvites] = useState([]);
  const [members, setMembers] = useState([]);
  const [newInviteEmail, setNewInviteEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInvites();
    loadMembers();
  }, [aptechkaId]);

  const loadInvites = async () => {
    try {
      const { data, error } = await supabase
        .from('aptechka_invites')
        .select('*')
        .eq('aptechka_id', aptechkaId)
        .eq('status', 'pending');

      if (error) throw error;
      setInvites(data || []);
    } catch (error) {
      console.error('Ошибка загрузки приглашений:', error);
    }
  };

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('aptechka_members')
        .select(`
          *,
          profiles:user_id (
            email,
            full_name
          )
        `)
        .eq('aptechka_id', aptechkaId);

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Ошибка загрузки участников:', error);
    }
  };

  const sendInvite = async () => {
    if (!newInviteEmail) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('aptechka_invites')
        .insert([
          {
            aptechka_id: aptechkaId,
            invited_email: newInviteEmail,
            invited_by: user.id,
            status: 'pending'
          }
        ]);

      if (error) throw error;
      
      setNewInviteEmail('');
      loadInvites();
      alert('Приглашение отправлено!');
    } catch (error) {
      console.error('Ошибка отправки приглашения:', error);
      alert('Ошибка при отправке приглашения');
    } finally {
      setLoading(false);
    }
  };

  const cancelInvite = async (inviteId) => {
    try {
      const { error } = await supabase
        .from('aptechka_invites')
        .delete()
        .eq('id', inviteId);

      if (error) throw error;
      loadInvites();
    } catch (error) {
      console.error('Ошибка отмены приглашения:', error);
    }
  };

  const removeMember = async (memberId) => {
    if (!window.confirm('Удалить участника из аптечки?')) return;
    
    try {
      const { error } = await supabase
        .from('aptechka_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      loadMembers();
    } catch (error) {
      console.error('Ошибка удаления участника:', error);
    }
  };

  return (
    <div className="invite-manager-overlay">
      <div className="invite-manager">
        <div className="invite-manager-header">
          <h2>Управление участниками</h2>
          <button onClick={onClose} className="btn-close">✕</button>
        </div>

        <div className="invite-manager-content">
          <div className="invite-section">
            <h3>Пригласить нового участника</h3>
            <div className="invite-input">
              <input
                type="email"
                value={newInviteEmail}
                onChange={(e) => setNewInviteEmail(e.target.value)}
                placeholder="Email пользователя"
              />
              <button 
                onClick={sendInvite} 
                disabled={loading || !newInviteEmail}
                className="btn-invite"
              >
                {loading ? 'Отправка...' : 'Пригласить'}
              </button>
            </div>
          </div>

          <div className="members-section">
            <h3>Участники аптечки ({members.length})</h3>
            <div className="members-list">
              {members.map(member => (
                <div key={member.id} className="member-item">
                  <div className="member-info">
                    <span className="member-name">
                      {member.profiles?.full_name || member.profiles?.email}
                    </span>
                    <span className="member-role">
                      {member.role === 'owner' ? 'Владелец' : 'Участник'}
                    </span>
                  </div>
                  {member.role !== 'owner' && (
                    <button
                      onClick={() => removeMember(member.id)}
                      className="btn-remove-member"
                    >
                      Удалить
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {invites.length > 0 && (
            <div className="pending-invites-section">
              <h3>Ожидающие приглашения ({invites.length})</h3>
              <div className="invites-list">
                {invites.map(invite => (
                  <div key={invite.id} className="invite-item">
                    <span className="invite-email">{invite.invited_email}</span>
                    <button
                      onClick={() => cancelInvite(invite.id)}
                      className="btn-cancel-invite"
                    >
                      Отменить
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteManager;
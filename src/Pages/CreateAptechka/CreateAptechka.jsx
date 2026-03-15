import { useState } from 'react';
import { supabase } from '../../supabaseClient';
import './CreateAptechka.css';

const CreateAptechka = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    avatar: 'home'
  });
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitedUsers, setInvitedUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const avatarOptions = [
    { id: 'home', name: 'Домашняя', icon: '🏠' },
    { id: 'travel', name: 'Путешествие', icon: '✈️' },
    { id: 'kids', name: 'Детская', icon: '👶' },
    { id: 'car', name: 'Автомобильная', icon: '🚗' },
    { id: 'work', name: 'Рабочая', icon: '💼' },
    { id: 'sport', name: 'Спортивная', icon: '⚽' }
  ];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAvatarSelect = (avatarId) => {
    setFormData({
      ...formData,
      avatar: avatarId
    });
  };

  const addInvite = () => {
    if (inviteEmail && !invitedUsers.includes(inviteEmail)) {
      setInvitedUsers([...invitedUsers, inviteEmail]);
      setInviteEmail('');
    }
  };

  const removeInvite = (email) => {
    setInvitedUsers(invitedUsers.filter(user => user !== email));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Необходимо войти в систему');
        return;
      }

      const { data: aptechka, error: aptechkaError } = await supabase
        .from('aptechkas')
        .insert([
          {
            name: formData.name,
            description: formData.description,
            avatar: formData.avatar,
            owner_name: user.user_metadata?.name || user.email?.split('@')[0] || 'Владелец'
          }
        ])
        .select()
        .single();

      if (aptechkaError) throw aptechkaError;

      for (const email of invitedUsers) {
        await supabase
          .from('aptechka_invites')
          .insert([
            {
              aptechka_id: aptechka.id,
              invited_email: email,
              invited_by: user.id,
              status: 'pending'
            }
          ]);
      }

      alert('Аптечка успешно создана!');
      setFormData({ name: '', description: '', avatar: 'home' });
      setInvitedUsers([]);
      
    } catch (error) {
      console.error('Ошибка создания аптечки:', error);
      alert('Ошибка при создании аптечки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-aptechka">
      <div className="create-aptechka-container">
        <h1>Создать новую аптечку</h1>
        
        <form onSubmit={handleSubmit} className="aptechka-form">
          <div className="form-section">
            <h3>Выберите тип аптечки</h3>
            <div className="avatar-grid">
              {avatarOptions.map(option => (
                <div
                  key={option.id}
                  className={`avatar-option ${formData.avatar === option.id ? 'selected' : ''}`}
                  onClick={() => handleAvatarSelect(option.id)}
                >
                  <div className="avatar-icon">{option.icon}</div>
                  <span>{option.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="form-section">
            <div className="input-group">
              <label>Название аптечки *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Например: Домашняя аптечка"
                required
              />
            </div>
            
            <div className="input-group">
              <label>Описание</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Краткое описание аптечки"
                rows="3"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Пригласить пользователей</h3>
            <div className="invite-section">
              <div className="invite-input">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Email пользователя"
                />
                <button type="button" onClick={addInvite} className="btn-add">
                  Добавить
                </button>
              </div>
              
              {invitedUsers.length > 0 && (
                <div className="invited-users">
                  <h4>Приглашенные пользователи:</h4>
                  {invitedUsers.map(email => (
                    <div key={email} className="invited-user">
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => removeInvite(email)}
                        className="btn-remove"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="btn-create" disabled={loading}>
            {loading ? 'Создание...' : 'Создать аптечку'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateAptechka;
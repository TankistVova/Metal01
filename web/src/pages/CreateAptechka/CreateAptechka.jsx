import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './CreateAptechka.css';
import {
  FaHome, FaCar, FaBaby, FaPlane, FaRunning, FaBriefcase,
  FaHeart, FaDog, FaFirstAid, FaSnowflake, FaMountain, FaUmbrellaBeach,
  FaBicycle, FaSwimmer, FaDumbbell, FaMotorcycle, FaShip, FaTrain,
  FaUserMd, FaChild, FaUsers, FaUser, FaStar, FaLeaf
} from 'react-icons/fa';
import { GiCampingTent, GiMedicalPack } from 'react-icons/gi';
import { MdSportsSoccer, MdOutdoorGrill } from 'react-icons/md';

const CreateAptechka = ({ onClose, onCreated }) => {
  const [formData, setFormData] = useState({ name: '', description: '', avatar: 'home' });
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitedUsers, setInvitedUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const avatarOptions = [
    { id: 'home',      name: 'Домашняя',      icon: <FaHome /> },
    { id: 'car',       name: 'Автомобильная', icon: <FaCar /> },
    { id: 'kids',      name: 'Детская',       icon: <FaBaby /> },
    { id: 'travel',    name: 'Путешествие',   icon: <FaPlane /> },
    { id: 'sport',     name: 'Спортивная',    icon: <FaRunning /> },
    { id: 'work',      name: 'Рабочая',       icon: <FaBriefcase /> },
    { id: 'health',    name: 'Здоровье',       icon: <FaHeart /> },
    { id: 'pets',      name: 'Питомцы',        icon: <FaDog /> },
    { id: 'firstaid',  name: 'Первая помощь',  icon: <FaFirstAid /> },
    { id: 'winter',    name: 'Зимняя',        icon: <FaSnowflake /> },
    { id: 'mountain',  name: 'Горная',         icon: <FaMountain /> },
    { id: 'beach',     name: 'Пляжная',        icon: <FaUmbrellaBeach /> },
    { id: 'bike',      name: 'Велосипедная',   icon: <FaBicycle /> },
    { id: 'swim',      name: 'Плавание',      icon: <FaSwimmer /> },
    { id: 'gym',       name: 'Тренажёрная',    icon: <FaDumbbell /> },
    { id: 'moto',      name: 'Мотоциклетная', icon: <FaMotorcycle /> },
    { id: 'ship',      name: 'Морская',        icon: <FaShip /> },
    { id: 'train',     name: 'ЖД поездка',    icon: <FaTrain /> },
    { id: 'doctor',    name: 'Врачебная',     icon: <FaUserMd /> },
    { id: 'child',     name: 'Для ребёнка',  icon: <FaChild /> },
    { id: 'family',    name: 'Семейная',      icon: <FaUsers /> },
    { id: 'personal',  name: 'Личная',        icon: <FaUser /> },
    { id: 'camping',   name: 'Кемпинг',        icon: <GiCampingTent /> },
    { id: 'medpack',   name: 'Медпакет',       icon: <GiMedicalPack /> },
    { id: 'soccer',    name: 'Футбольная',    icon: <MdSportsSoccer /> },
    { id: 'outdoor',   name: 'На природе',    icon: <MdOutdoorGrill /> },
    { id: 'star',      name: 'Избранная',      icon: <FaStar /> },
    { id: 'nature',    name: 'Природная',     icon: <FaLeaf /> },
  ];

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { alert('Необходимо войти в систему'); return; }

      const { data: aptechka, error } = await supabase
        .from('aptechkas')
        .insert([{
          name: formData.name,
          description: formData.description,
          avatar: formData.avatar,
          owner_name: user.user_metadata?.name || user.email?.split('@')[0] || 'Владелец'
        }])
        .select()
        .single();

      if (error) throw error;

      for (const email of invitedUsers) {
        await supabase.from('aptechka_invites').insert([{
          aptechka_id: aptechka.id,
          invited_email: email,
          invited_by: user.id,
          status: 'pending'
        }]);
      }

      onCreated?.();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Ошибка при создании аптечки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ca-overlay" onClick={onClose}>
      <div className="ca-modal" onClick={e => e.stopPropagation()}>
        <button className="ca-close" type="button" onClick={onClose}>×</button>
        <h2 className="ca-title">Создать аптечку</h2>

        <form onSubmit={handleSubmit} className="ca-form">
          <div className="ca-field">
            <label>Тип аптечки</label>
            <div className="ca-avatar-grid">
              {avatarOptions.map(opt => (
                <div
                  key={opt.id}
                  className={`ca-avatar-option ${formData.avatar === opt.id ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, avatar: opt.id })}
                >
                  <span className="ca-avatar-icon">{opt.icon}</span>
                  <span>{opt.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="ca-field">
            <label>Название *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Например: Домашняя аптечка"
              required
            />
          </div>

          <div className="ca-field">
            <label>Описание</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Краткое описание"
              rows={3}
            />
          </div>

          <div className="ca-field">
            <label>Пригласить пользователей</label>
            <div className="ca-invite-row">
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="Email пользователя"
              />
              <button type="button" className="ca-btn-add" onClick={() => {
                if (inviteEmail && !invitedUsers.includes(inviteEmail)) {
                  setInvitedUsers([...invitedUsers, inviteEmail]);
                  setInviteEmail('');
                }
              }}>Добавить</button>
            </div>
            {invitedUsers.length > 0 && (
              <div className="ca-invited-list">
                {invitedUsers.map(email => (
                  <div key={email} className="ca-invited-item">
                    <span>{email}</span>
                    <button type="button" onClick={() => setInvitedUsers(invitedUsers.filter(u => u !== email))}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="ca-btn-submit" disabled={loading}>
            {loading ? 'Создание...' : 'Создать аптечку'}
          </button>
          <button type="button" className="ca-btn-cancel" onClick={onClose}>Отмена</button>
        </form>
      </div>
    </div>
  );
};

export default CreateAptechka;

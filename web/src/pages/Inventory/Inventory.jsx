import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import AuthHeader from '../../components/AuthHeader';
import Footer from '../../components/Footer';
import './Inventory.css';
import LoadingScreen from '../../components/LoadingScreen';
import phoneImg from '../../asset/phone/phone.png';
import phoneContent from '../../asset/phone/phone-content.png';
import phoneAirContent from '../../asset/phone/phone-air-content.png';
import phoneAirQr from '../../asset/phone/phone-air-qr.png';
import phoneBangs from '../../asset/phone/phone-bangs.png';
import uploadIcon from '../../asset/icons/upload-01.png';
import photoIcon from '../../asset/icons/photo.png';
import pullIcon from '../../asset/icons/Pull.png';
import penIcon from '../../asset/icons/Pen.png';
import crownIcon from '../../asset/icons/crown.png';
import CreateAptechka from '../CreateAptechka/CreateAptechka.jsx';
import {
  FaHome, FaCar, FaBaby, FaPlane, FaRunning, FaBriefcase,
  FaHeart, FaDog, FaFirstAid, FaSnowflake, FaMountain, FaUmbrellaBeach,
  FaBicycle, FaSwimmer, FaDumbbell, FaMotorcycle, FaShip, FaTrain,
  FaUserMd, FaChild, FaUsers, FaUser, FaStar, FaLeaf
} from 'react-icons/fa';
import { GiCampingTent, GiMedicalPack } from 'react-icons/gi';
import { MdSportsSoccer, MdOutdoorGrill } from 'react-icons/md';

const CATEGORIES = [
  { value: 'all', label: 'Все' },
  { value: 'fever', label: 'Жаропонижающие' },
  { value: 'antiviral', label: 'Противовирусные' },
  { value: 'pain', label: 'Обезболивающие' },
  { value: 'allergy', label: 'Противоаллергическое' },
  { value: 'vitamins', label: 'Витамины и минералы' },
  { value: 'antistress', label: 'Психотропные' },
];

function Inventory() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aptechkas, setAptechkas] = useState([]);
  const [selectedKit, setSelectedKit] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [kitMembers, setKitMembers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMenu, setShowMenu] = useState(null);
  const [newMedicine, setNewMedicine] = useState({
    name: '', dose: '', doseUnit: 'мг', quantity: 1, quantityUnit: 'шт', icon: '💊', category: 'pain',
    expiry_date: '', note: '', image: null
  });
  const [showIntro, setShowIntro] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [typedText, setTypedText] = useState('');
  const navigate = useNavigate();

  const avatarIcons = {
    home: <FaHome />, car: <FaCar />, kids: <FaBaby />, travel: <FaPlane />,
    sport: <FaRunning />, work: <FaBriefcase />, health: <FaHeart />, pets: <FaDog />,
    firstaid: <FaFirstAid />, winter: <FaSnowflake />, mountain: <FaMountain />,
    beach: <FaUmbrellaBeach />, bike: <FaBicycle />, swim: <FaSwimmer />,
    gym: <FaDumbbell />, moto: <FaMotorcycle />, ship: <FaShip />, train: <FaTrain />,
    doctor: <FaUserMd />, child: <FaChild />, family: <FaUsers />, personal: <FaUser />,
    camping: <GiCampingTent />, medpack: <GiMedicalPack />, soccer: <MdSportsSoccer />,
    outdoor: <MdOutdoorGrill />, star: <FaStar />, nature: <FaLeaf />
  };

  useEffect(() => {
    checkUser();
    const handleOpenAdd = () => setShowAddForm(true);
    window.addEventListener('openAddMedicine', handleOpenAdd);
    return () => window.removeEventListener('openAddMedicine', handleOpenAdd);
  }, []);

  useEffect(() => {
    if (showIntro) {
      const fullText = 'Все лекарства в одном месте — Инвентарь';
      let i = 0;
      const typeTimer = setInterval(() => {
        setTypedText(fullText.slice(0, i + 1));
        i++;
        if (i >= fullText.length) clearInterval(typeTimer);
      }, 50);
      const timer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          setShowIntro(false);
          localStorage.setItem('inventoryIntroShown', Date.now().toString());
        }, 500);
      }, 4000);
      return () => { clearTimeout(timer); clearInterval(typeTimer); };
    }
  }, [showIntro]);

  useEffect(() => {
    if (selectedKit) { loadMedicines(selectedKit); loadKitMembers(selectedKit); }
  }, [selectedKit]);

  useEffect(() => {
    document.body.style.overflow = (showAddForm || showCreateModal) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showAddForm, showCreateModal]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/login'); return; }
    setUser(user);
    await loadAptechkas(user.id);
    setLoading(false);
  };

  const loadMedicines = async (aptechkaId) => {
    const { data, error } = await supabase.from('medicines').select('*').eq('aptechka_id', aptechkaId);
    if (!error) setMedicines(data || []);
  };

  const loadAptechkas = async (userId) => {
    const { data: owned } = await supabase.from('aptechkas').select('*').eq('owner_id', userId);
    const { data: memberRows } = await supabase.from('aptechka_members').select('aptechka_id').eq('user_id', userId);
    let shared = [];
    if (memberRows?.length) {
      const ids = memberRows.map(m => m.aptechka_id);
      const { data } = await supabase.from('aptechkas').select('*').in('id', ids).neq('owner_id', userId);
      shared = data || [];
    }
    const all = [...(owned || []), ...shared];
    setAptechkas(all);
    if (all.length > 0) setSelectedKit(all[0].id);
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    if (!selectedKit) return;
    let imageUrl = null;
    if (newMedicine.image) {
      const fileExt = newMedicine.image.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('medicine-images').upload(fileName, newMedicine.image, { cacheControl: '3600', upsert: false });
      if (!uploadError) {
        const { data } = supabase.storage.from('medicine-images').getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }
    }
    const dose = newMedicine.dose ? `${newMedicine.dose} ${newMedicine.doseUnit}` : '';
    const { error } = await supabase.from('medicines').insert([{
      aptechka_id: selectedKit, name: newMedicine.name, dose,
      quantity: newMedicine.quantity, icon: newMedicine.icon, category: newMedicine.category,
      expiry_date: newMedicine.expiry_date || null, image_url: imageUrl
    }]);
    if (!error) {
      setNewMedicine({ name: '', dose: '', doseUnit: 'мг', quantity: 1, quantityUnit: 'шт', icon: '💊', category: 'pain', expiry_date: '', note: '', image: null });
      setShowAddForm(false);
      loadMedicines(selectedKit);
    }
  };

  const loadKitMembers = async (aptechkaId) => {
    const { data: aptechka } = await supabase.from('aptechkas').select('owner_id, owner_name').eq('id', aptechkaId).single();
    if (!aptechka?.owner_id) return;
    const { data: { user } } = await supabase.auth.getUser();
    const allMembers = [];
    if (user?.id === aptechka.owner_id) {
      allMembers.push({ id: user.id, full_name: user.user_metadata?.name || user.email?.split('@')[0] || 'Владелец', avatar_url: user.user_metadata?.avatar_url, is_owner: true });
    } else {
      allMembers.push({ id: aptechka.owner_id, full_name: aptechka.owner_name || 'Владелец', avatar_url: null, is_owner: true });
    }
    const { data: members } = await supabase.from('aptechka_members').select('user_id').eq('aptechka_id', aptechkaId);
    if (members?.length) {
      members.forEach((m, idx) => {
        if (m.user_id !== aptechka.owner_id) {
          const isMe = user?.id === m.user_id;
          allMembers.push({ id: m.user_id, full_name: isMe ? (user.user_metadata?.name || 'Я') : `Участник ${idx + 1}`, avatar_url: isMe ? user.user_metadata?.avatar_url : null, is_owner: false });
        }
      });
    }
    setKitMembers(allMembers);
  };

  const handleDeleteMedicine = async (medicineId) => {
    if (!window.confirm('Удалить это лекарство?')) return;
    const { error } = await supabase.from('medicines').delete().eq('id', medicineId);
    if (!error) { setShowMenu(null); loadMedicines(selectedKit); }
  };

  const handleDeleteAptechka = async (aptechkaId) => {
    if (!window.confirm('Удалить эту аптечку?')) return;
    const { error } = await supabase.from('aptechkas').delete().eq('id', aptechkaId);
    if (!error) await loadAptechkas(user.id);
  };

  const filteredMedicines = activeCategory === 'all'
    ? medicines
    : medicines.filter(m => m.category === activeCategory);

  const selectedKitName = aptechkas.find(k => k.id === selectedKit)?.name || 'Аптечка';

  if (loading) return <LoadingScreen />;

  if (showIntro) {
    const bubbles = ['💊', '🩺', '💉', '🩹', '🌡️', '💊', '🩹', '💉'];
    return (
      <div className={`inventory-intro ${fadeOut ? 'fade-out' : ''}`}>
        <div className="intro-bubbles">
          {bubbles.map((b, i) => (
            <span key={i} className="intro-bubble" style={{'--i': i}}>{b}</span>
          ))}
        </div>
        <div className="intro-content">
          <div className="intro-left">
            <h1>{typedText}<span className="intro-cursor">|</span></h1>
            <p>Здесь вы сможете проводить инвентаризацию, добавлять новые лекарства и аптечки, а также редактировать их.</p>
          </div>
          <div className="intro-right">
            <div className="intro-phone-container">
              <img src={phoneImg} alt="Phone" className="intro-phone" />
              <img src={phoneContent} alt="Content" className="intro-phone-content" />
              <img src={phoneAirContent} alt="Air Content" className="intro-phone-air" />
              <img src={phoneAirQr} alt="QR" className="intro-phone-qr" />
              <img src={phoneBangs} alt="Bangs" className="intro-phone-bangs" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <AuthHeader />

      <div className="mobile-kit-list">
        {aptechkas.map(kit => (
          <button
            key={kit.id}
            className={`mobile-kit-btn ${selectedKit === kit.id ? 'active' : ''}`}
            onClick={() => setSelectedKit(kit.id)}
          >
            <span className="mobile-kit-icon">{avatarIcons[kit.avatar] || <FaHome />}</span>
            {kit.name}
          </button>
        ))}
        <button className="mobile-kit-btn mobile-kit-add" onClick={() => setShowCreateModal(true)}>+ Добавить</button>
      </div>

      <div className="inventory-page">
        <aside className="inventory-sidebar">
          <h3 className="sidebar-title">Аптечки</h3>
          <ul className="sidebar-list">
            {aptechkas.map(kit => (
              <li key={kit.id} className={`sidebar-item ${selectedKit === kit.id ? 'active' : ''}`}>
                <button className="sidebar-btn" onClick={() => setSelectedKit(kit.id)}>
                  <span className="sidebar-icon">{avatarIcons[kit.avatar] || <FaHome />}</span>
                  {kit.name}
                </button>
                <button className="sidebar-delete" onClick={() => handleDeleteAptechka(kit.id)}>×</button>
              </li>
            ))}
            <li className="sidebar-item sidebar-add" onClick={() => setShowCreateModal(true)}>
              <span>+</span> Добавить аптечку
            </li>
          </ul>
        </aside>

        <main className="inventory-main">
          <div className="inventory-title-row">
            <h1 className="inventory-title">{selectedKitName}</h1>
            <div className="kit-members">
              {kitMembers.map(member => (
                <div key={member.id} className="member-avatar" title={member.full_name}>
                  {member.avatar_url
                    ? <img src={member.avatar_url} alt={member.full_name} />
                    : <div className="avatar-placeholder">{member.full_name?.[0] || '?'}</div>
                  }
                  {member.is_owner && <img src={crownIcon} alt="Owner" className="owner-crown" />}
                </div>
              ))}
            </div>
          </div>

          <div className="category-filters">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                className={`category-chip ${activeCategory === cat.value ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.value)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <h2 className="medicines-title">Все таблетки в аптечке</h2>

          <div className="medicines-grid">
            <div className="medicine-card medicine-card-add" onClick={() => setShowAddForm(true)}>
              <span className="add-plus">+</span>
            </div>
            {filteredMedicines.map(med => (
              <div key={med.id} className="medicine-card">
                <button className="btn-edit" onClick={() => setShowMenu(showMenu === med.id ? null : med.id)}>
                  <img src={penIcon} alt="Edit" />
                </button>
                {showMenu === med.id && (
                  <div className="action-menu">
                    <button onClick={() => alert('Редактирование в разработке')}>Редактировать</button>
                    <button onClick={() => handleDeleteMedicine(med.id)}>Удалить</button>
                  </div>
                )}
                {med.image_url
                  ? <img src={med.image_url} alt={med.name} className="medicine-image" />
                  : <div className="medicine-icon">{med.icon}</div>
                }
                <div className="medicine-info">
                  <div className="medicine-dose-row">
                    <span>{med.dose}</span>
                    <div className="medicine-dose-divider"></div>
                    <span className="quantity-badge">
                      <img src={pullIcon} alt="" className="pull-icon" /> {med.quantity} шт
                    </span>
                  </div>
                  <h3>{med.name}</h3>
                  <p>{CATEGORIES.find(c => c.value === med.category)?.label || med.category}</p>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content add-medicine-modal" onClick={e => e.stopPropagation()}>
            <h2 className="add-modal-title">Добавление лекарства</h2>
            <button className="am-modal-close" type="button" onClick={() => setShowAddForm(false)}>×</button>
            <form onSubmit={handleAddMedicine} className="add-medicine-form">

              <div className="am-photo-row">
                <label className="am-photo-clickable">
                  <div className="am-photo-preview">
                    {newMedicine.image
                      ? <img src={URL.createObjectURL(newMedicine.image)} alt="preview" />
                      : <img src={photoIcon} alt="photo" className="am-photo-placeholder" />
                    }
                  </div>
                  <div className="am-photo-info">
                    <span className="am-photo-label">{newMedicine.image ? newMedicine.image.name : 'Нет фотографии'}</span>
                    <span className="am-photo-sub"><img src={uploadIcon} alt="" className="am-upload-icon" /> Loading whit phone</span>
                  </div>
                  <input type="file" accept="image/*" onChange={e => setNewMedicine({...newMedicine, image: e.target.files[0]})} style={{display:'none'}} />
                </label>
                {newMedicine.image && (
                  <button type="button" className="am-photo-delete-btn" onClick={() => setNewMedicine({...newMedicine, image: null})}>×</button>
                )}
              </div>

              <div className="am-field">
                <label>Название</label>
                <input type="text" placeholder="Название" value={newMedicine.name} onChange={e => setNewMedicine({...newMedicine, name: e.target.value})} required />
              </div>

              <div className="am-row">
                <div className="am-field">
                  <label>Дозировка</label>
                  <div className="am-input-unit">
                    <input type="text" placeholder="Дозировка" value={newMedicine.dose} onChange={e => setNewMedicine({...newMedicine, dose: e.target.value})} />
                    <select value={newMedicine.doseUnit} onChange={e => setNewMedicine({...newMedicine, doseUnit: e.target.value})}>
                      <option>мг</option><option>мл</option><option>г</option><option>МЕ</option>
                    </select>
                  </div>
                </div>
                <div className="am-field">
                  <label>Количество</label>
                  <div className="am-input-unit">
                    <input type="number" placeholder="Количество" value={newMedicine.quantity} onChange={e => setNewMedicine({...newMedicine, quantity: parseInt(e.target.value) || 1})} min="1" />
                    <select value={newMedicine.quantityUnit} onChange={e => setNewMedicine({...newMedicine, quantityUnit: e.target.value})}>
                      <option>шт</option><option>уп</option><option>мл</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="am-field">
                <label>Категория</label>
                <div className="am-select-wrap">
                  <select value={newMedicine.category} onChange={e => setNewMedicine({...newMedicine, category: e.target.value})}>
                    <option value="">Категория</option>
                    <option value="pain">Обезболивающие</option>
                    <option value="fever">Жаропонижающие</option>
                    <option value="allergy">Противоаллергическое</option>
                    <option value="antiviral">Противовирусные</option>
                    <option value="vitamins">Витамины и минералы</option>
                    <option value="antistress">Психотропные</option>
                    <option value="stomach">Для желудка</option>
                    <option value="other">Другое</option>
                  </select>
                </div>
              </div>

              <div className="am-field">
                <label>Срок годности</label>
                <div className="am-date-wrap">
                  <input type="date" value={newMedicine.expiry_date} onChange={e => setNewMedicine({...newMedicine, expiry_date: e.target.value})} />
                </div>
              </div>

              <div className="am-field">
                <label>Примечание/инструкция</label>
                <textarea placeholder="Примечание/инструкция..." value={newMedicine.note} onChange={e => setNewMedicine({...newMedicine, note: e.target.value})} rows={4} />
              </div>

              <button type="submit" className="am-btn-submit">Добавить</button>
              <button type="button" className="am-btn-cancel" onClick={() => setShowAddForm(false)}>Отмена</button>
            </form>
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreateAptechka
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { loadAptechkas(user.id); setShowCreateModal(false); }}
        />
      )}

      <Footer />
    </>
  );
}

export default Inventory;

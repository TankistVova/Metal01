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
import homeIcon from '../../asset/fontMedKit/Home.png';
import carIcon from '../../asset/fontMedKit/Car.png';
import babyIcon from '../../asset/fontMedKit/Baby.png';
import globeIcon from '../../asset/fontMedKit/Globe.png';
import imageIcon from '../../asset/icons/image.png';
import pullIcon from '../../asset/icons/Pull.png';
import penIcon from '../../asset/icons/Pen.png';
import crownIcon from '../../asset/icons/crown.png';

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
  const [showMenu, setShowMenu] = useState(null);
  const [newMedicine, setNewMedicine] = useState({
    name: '', dose: '', quantity: 1, icon: '💊', category: 'pain', expiry_date: '', image: null
  });
  const [showIntro, setShowIntro] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [typedText, setTypedText] = useState('');
  const navigate = useNavigate();

  const avatarIcons = {
    home: homeIcon, travel: globeIcon, kids: babyIcon, car: carIcon, work: homeIcon, sport: globeIcon
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
    const { error } = await supabase.from('medicines').insert([{
      aptechka_id: selectedKit, name: newMedicine.name, dose: newMedicine.dose,
      quantity: newMedicine.quantity, icon: newMedicine.icon, category: newMedicine.category,
      expiry_date: newMedicine.expiry_date || null, image_url: imageUrl
    }]);
    if (!error) {
      setNewMedicine({ name: '', dose: '', quantity: 1, icon: '💊', category: 'pain', expiry_date: '', image: null });
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

      {/* Мобильный список аптечек — вне inventory-page */}
      <div className="mobile-kit-list">
        {aptechkas.map(kit => (
          <button
            key={kit.id}
            className={`mobile-kit-btn ${selectedKit === kit.id ? 'active' : ''}`}
            onClick={() => setSelectedKit(kit.id)}
          >
            <img src={avatarIcons[kit.avatar] || homeIcon} alt="" />
            {kit.name}
          </button>
        ))}
        <button className="mobile-kit-btn mobile-kit-add" onClick={() => navigate('/create-aptechka')}>+ Добавить</button>
      </div>

      <div className="inventory-page">
        {/* Левая панель */}
        <aside className="inventory-sidebar">
          <h3 className="sidebar-title">Аптечки</h3>
          <ul className="sidebar-list">
            {aptechkas.map(kit => (
              <li key={kit.id} className={`sidebar-item ${selectedKit === kit.id ? 'active' : ''}`}>
                <button className="sidebar-btn" onClick={() => setSelectedKit(kit.id)}>
                  <img src={avatarIcons[kit.avatar] || homeIcon} alt="" className="sidebar-icon" />
                  {kit.name}
                </button>
                <button className="sidebar-delete" onClick={() => handleDeleteAptechka(kit.id)}>×</button>
              </li>
            ))}
            <li className="sidebar-item sidebar-add" onClick={() => navigate('/create-aptechka')}>
              <span>+</span> Добавить аптечку
            </li>
          </ul>
        </aside>

        {/* Правая часть */}
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
            <div className="medicine-card medicine-card-add" onClick={() => setShowAddForm(true)}>
              <span className="add-plus">+</span>
            </div>
          </div>
        </main>
      </div>

      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Добавить лекарство</h2>
              <button className="modal-close" onClick={() => setShowAddForm(false)}>×</button>
            </div>
            <form onSubmit={handleAddMedicine} className="add-medicine-form">
              <select value={selectedKit || ''} onChange={e => setSelectedKit(e.target.value)} required>
                <option value="" disabled>Выберите аптечку</option>
                {aptechkas.map(kit => <option key={kit.id} value={kit.id}>{kit.name}</option>)}
              </select>
              <input type="text" placeholder="Название лекарства" value={newMedicine.name} onChange={e => setNewMedicine({...newMedicine, name: e.target.value})} required />
              <input type="text" placeholder="Дозировка (напр. 500 мг)" value={newMedicine.dose} onChange={e => setNewMedicine({...newMedicine, dose: e.target.value})} />
              <input type="number" placeholder="Количество" value={newMedicine.quantity} onChange={e => setNewMedicine({...newMedicine, quantity: parseInt(e.target.value)})} min="1" />
              <select value={newMedicine.category} onChange={e => setNewMedicine({...newMedicine, category: e.target.value})}>
                <option value="pain">Обезболивающие</option>
                <option value="fever">Жаропонижающие</option>
                <option value="allergy">Противоаллергическое</option>
                <option value="antiviral">Противовирусные</option>
                <option value="vitamins">Витамины и минералы</option>
                <option value="antistress">Психотропные</option>
                <option value="stomach">Для желудка</option>
                <option value="other">Другое</option>
              </select>
              <input type="date" value={newMedicine.expiry_date} onChange={e => setNewMedicine({...newMedicine, expiry_date: e.target.value})} />
              <label className="file-upload-label">
                <img src={imageIcon} alt="Upload" className="upload-icon" />
                <span>Загрузить фото</span>
                <input type="file" accept="image/*" onChange={e => setNewMedicine({...newMedicine, image: e.target.files[0]})} style={{display:'none'}} />
              </label>
              {newMedicine.image && <span className="file-name">{newMedicine.image.name}</span>}
              <button type="submit" className="btn-submit">Добавить</button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

export default Inventory;

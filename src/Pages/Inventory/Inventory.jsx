import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import AuthHeader from '../../components/AuthHeader';
import Footer from '../../components/Footer';
import './Inventory.css';
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

function Inventory() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aptechkas, setAptechkas] = useState([]);
  const [selectedKit, setSelectedKit] = useState(null);
  const [kitMembers, setKitMembers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [hoveredMedicine, setHoveredMedicine] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showMenu, setShowMenu] = useState(null);
  const [newMedicine, setNewMedicine] = useState({
    name: '',
    dose: '',
    quantity: 1,
    icon: '💊',
    category: 'cold',
    expiry_date: '',
    image: null
  });
  const [showIntro, setShowIntro] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const navigate = useNavigate();

  const avatarIcons = {
    home: homeIcon,
    travel: globeIcon,
    kids: babyIcon,
    car: carIcon,
    work: homeIcon,
    sport: globeIcon
  };

  useEffect(() => {
    checkUser();
    const handleOpenAdd = () => setShowAddForm(true);
    window.addEventListener('openAddMedicine', handleOpenAdd);
    return () => window.removeEventListener('openAddMedicine', handleOpenAdd);
  }, []);

  useEffect(() => {
    if (showIntro) {
      const timer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          setShowIntro(false);
          localStorage.setItem('inventoryIntroShown', Date.now().toString());
        }, 500);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showIntro]);

  useEffect(() => {
    if (selectedKit) {
      loadMedicines(selectedKit);
      loadKitMembers(selectedKit);
    }
  }, [selectedKit]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
    } else {
      setUser(user);
      await loadAptechkas(user.id);
      
      const lastShown = localStorage.getItem('inventoryIntroShown');
      const oneDayInMs = 24 * 60 * 60 * 1000;
      if (lastShown && Date.now() - parseInt(lastShown) < oneDayInMs) {
        setShowIntro(false);
      }
    }
    setLoading(false);
  };

  const loadMedicines = async (aptechkaId) => {
    const { data, error } = await supabase
      .from('medicines')
      .select('*')
      .eq('aptechka_id', aptechkaId);
    
    if (error) {
      console.error('Ошибка загрузки лекарств:', error);
    } else {
      setMedicines(data || []);
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    if (!selectedKit) return;

    let imageUrl = null;
    if (newMedicine.image) {
      const fileExt = newMedicine.image.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('medicine-images')
        .upload(fileName, newMedicine.image, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Ошибка загрузки фото:', uploadError);
        alert(`Ошибка загрузки фото: ${uploadError.message}`);
      } else {
        const { data } = supabase.storage
          .from('medicine-images')
          .getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }
    }

    const { error } = await supabase
      .from('medicines')
      .insert([{
        aptechka_id: selectedKit,
        name: newMedicine.name,
        dose: newMedicine.dose,
        quantity: newMedicine.quantity,
        icon: newMedicine.icon,
        category: newMedicine.category,
        expiry_date: newMedicine.expiry_date || null,
        image_url: imageUrl
      }]);

    if (error) {
      console.error('Ошибка добавления лекарства:', error);
      alert('Ошибка при добавлении лекарства');
    } else {
      setNewMedicine({ name: '', dose: '', quantity: 1, icon: '💊', category: 'cold', expiry_date: '', image: null });
      setShowAddForm(false);
      loadMedicines(selectedKit);
    }
  };

  const loadAptechkas = async (userId) => {
    // Загружаем аптечки, где пользователь владелец
    const { data: ownedAptechkas, error: ownedError } = await supabase
      .from('aptechkas')
      .select('*')
      .eq('owner_id', userId);
    
    // Загружаем аптечки, где пользователь участник
    const { data: memberAptechkas, error: memberError } = await supabase
      .from('aptechka_members')
      .select('aptechka_id')
      .eq('user_id', userId);
    
    if (memberError) {
      console.error('Ошибка загрузки участия:', memberError);
    }
    
    // Загружаем данные аптечек, где участник
    let sharedAptechkas = [];
    if (memberAptechkas && memberAptechkas.length > 0) {
      const aptechkaIds = memberAptechkas.map(m => m.aptechka_id);
      const { data, error } = await supabase
        .from('aptechkas')
        .select('*')
        .in('id', aptechkaIds)
        .neq('owner_id', userId); // Исключаем те, где уже владелец
      
      if (!error) {
        sharedAptechkas = data || [];
      }
    }
    
    if (ownedError) {
      console.error('Ошибка загрузки аптечек:', ownedError);
    } else {
      const allAptechkas = [...(ownedAptechkas || []), ...sharedAptechkas];
      setAptechkas(allAptechkas);
      if (allAptechkas.length > 0) {
        setSelectedKit(allAptechkas[0].id);
      }
    }
  };

  const loadKitMembers = async (aptechkaId) => {
    const { data: aptechka } = await supabase
      .from('aptechkas')
      .select('owner_id, owner_name')
      .eq('id', aptechkaId)
      .single();
    
    if (aptechka?.owner_id) {
      const { data: { user } } = await supabase.auth.getUser();
      
      const allMembers = [];
      
      if (user?.id === aptechka.owner_id) {
        allMembers.push({
          id: user.id,
          full_name: user.user_metadata?.name || user.email?.split('@')[0] || 'Владелец',
          avatar_url: user.user_metadata?.avatar_url,
          is_owner: true
        });
      } else {
        allMembers.push({
          id: aptechka.owner_id,
          full_name: aptechka.owner_name || 'Владелец',
          avatar_url: null,
          is_owner: true
        });
      }
      
      const { data: members } = await supabase
        .from('aptechka_members')
        .select('user_id')
        .eq('aptechka_id', aptechkaId);
      
      if (members && members.length > 0) {
        members.forEach((m, idx) => {
          if (m.user_id !== aptechka.owner_id) {
            const isCurrentUser = user?.id === m.user_id;
            allMembers.push({
              id: m.user_id,
              full_name: isCurrentUser ? (user.user_metadata?.name || user.email?.split('@')[0] || 'Я') : `Участник ${idx + 1}`,
              avatar_url: isCurrentUser ? user.user_metadata?.avatar_url : null,
              is_owner: false
            });
          }
        });
      }
      
      setKitMembers(allMembers);
    }
  };

  const handleDeleteMedicine = async (medicineId) => {
    if (!window.confirm('Удалить это лекарство?')) return;
    
    const { error } = await supabase
      .from('medicines')
      .delete()
      .eq('id', medicineId);
    
    if (error) {
      console.error('Ошибка удаления:', error);
      alert('Ошибка при удалении лекарства');
    } else {
      setShowMenu(null);
      loadMedicines(selectedKit);
    }
  };

  const handleDeleteAptechka = async (aptechkaId) => {
    if (!window.confirm('Удалить эту аптечку? Все лекарства будут удалены.')) return;
    
    const { error } = await supabase
      .from('aptechkas')
      .delete()
      .eq('id', aptechkaId);
    
    if (error) {
      console.error('Ошибка удаления:', error);
      alert('Ошибка при удалении аптечки');
    } else {
      await loadAptechkas(user.id);
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  if (showIntro) {
    return (
      <div className={`inventory-intro ${fadeOut ? 'fade-out' : ''}`}>
        <div className="intro-content">
          <div className="intro-left">
            <h1>Все лекарства в одном месте - Инвентарь</h1>
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
      <div className="inventory-page">
        <div className="inventory-container">
          <div className="inventory-header">
            <div className="section-label">Ваши аптечки</div>
          </div>

          <div className="kits-tabs">
            {aptechkas.map(kit => (
              <div key={kit.id} className="kit-tab-wrapper">
                <button
                  className={`kit-tab ${selectedKit === kit.id ? 'active' : ''}`}
                  onClick={() => setSelectedKit(kit.id)}
                >
                  <span className="kit-icon">
                    <img src={avatarIcons[kit.avatar] || homeIcon} alt={kit.name} />
                  </span>
                  <span className="kit-name">{kit.name}</span>
                </button>
                <button className="kit-delete" onClick={() => handleDeleteAptechka(kit.id)}>×</button>
              </div>
            ))}
            <button className="kit-tab-add" onClick={() => navigate('/create-aptechka')}>
              <span className="add-icon">+</span>
            </button>
          </div>

          <div className="medicines-section">
            <div className="section-header">
              <div className="header-left">
                <h2>{aptechkas.find(k => k.id === selectedKit)?.name || 'Аптечка'}</h2>
                <div className="kit-members">
                  {kitMembers.map(member => (
                    <div key={member.id} className="member-avatar" title={member.full_name}>
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt={member.full_name} />
                      ) : (
                        <div className="avatar-placeholder">{member.full_name?.[0] || '?'}</div>
                      )}
                      {member.is_owner && <img src={crownIcon} alt="Owner" className="owner-crown" />}
                    </div>
                  ))}
                </div>
              </div>
              <button className="btn-sort">Сортировать</button>
            </div>

            <div className="medicines-list">
              {medicines.map(med => (
                <div 
                  key={med.id} 
                  className="medicine-card"
                  onMouseEnter={() => setHoveredMedicine(med)}
                  onMouseLeave={() => setHoveredMedicine(null)}
                >
                  {med.image_url ? (
                    <img src={med.image_url} alt={med.name} className="medicine-image" />
                  ) : (
                    <div className="medicine-icon">{med.icon}</div>
                  )}
                  <div className="medicine-info">
                    <h3>{med.name}</h3>
                    <p>{med.dose} | <span className="quantity-badge"><img src={pullIcon} alt="" className="pull-icon" /> {med.quantity} шт</span></p>
                  </div>
                  <div className="medicine-actions">
                    <button className="btn-edit" onClick={() => setShowMenu(showMenu === med.id ? null : med.id)}>
                      <img src={penIcon} alt="Edit" />
                    </button>
                    {showMenu === med.id && (
                      <div className="action-menu">
                        <button onClick={() => alert('Редактирование в разработке')}>Редактировать</button>
                        <button onClick={() => handleDeleteMedicine(med.id)}>Удалить</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {hoveredMedicine && (
              <div className="medicine-preview">
                {hoveredMedicine.image_url && (
                  <img src={hoveredMedicine.image_url} alt={hoveredMedicine.name} className="preview-image" />
                )}
                <h3>{hoveredMedicine.name}</h3>
                {hoveredMedicine.expiry_date && (
                  <p className="expiry-date">Срок годности: {new Date(hoveredMedicine.expiry_date).toLocaleDateString('ru-RU')}</p>
                )}
              </div>
            )}

            {showAddForm && (
              <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>Добавить лекарство</h2>
                    <button className="modal-close" onClick={() => setShowAddForm(false)}>×</button>
                  </div>
                  <form onSubmit={handleAddMedicine} className="add-medicine-form">
                    <select
                      value={selectedKit || ''}
                      onChange={(e) => setSelectedKit(e.target.value)}
                      required
                    >
                      <option value="" disabled>Выберите аптечку</option>
                      {aptechkas.map(kit => (
                        <option key={kit.id} value={kit.id}>{kit.name}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Название лекарства"
                      value={newMedicine.name}
                      onChange={(e) => setNewMedicine({...newMedicine, name: e.target.value})}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Дозировка (напр. 500 мг)"
                      value={newMedicine.dose}
                      onChange={(e) => setNewMedicine({...newMedicine, dose: e.target.value})}
                    />
                    <input
                      type="number"
                      placeholder="Количество"
                      value={newMedicine.quantity}
                      onChange={(e) => setNewMedicine({...newMedicine, quantity: parseInt(e.target.value)})}
                      min="1"
                    />
                    <select
                      value={newMedicine.category}
                      onChange={(e) => setNewMedicine({...newMedicine, category: e.target.value})}
                    >
                      <option value="cold">От простуды</option>
                      <option value="pain">От боли</option>
                      <option value="allergy">От аллергии</option>
                      <option value="stomach">Для желудка</option>
                      <option value="heart">Для сердца</option>
                      <option value="immunity">Для иммунитета</option>
                      <option value="antistress">Антистресс</option>
                      <option value="vitamins">Витамины</option>
                      <option value="antiviral">Противовирусные</option>
                      <option value="other">Другое</option>
                    </select>
                    <input
                      type="date"
                      placeholder="Срок годности"
                      value={newMedicine.expiry_date}
                      onChange={(e) => setNewMedicine({...newMedicine, expiry_date: e.target.value})}
                    />
                    <label className="file-upload-label">
                      <img src={imageIcon} alt="Upload" className="upload-icon" />
                      <span>Загрузить фото</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setNewMedicine({...newMedicine, image: e.target.files[0]})}
                        style={{display: 'none'}}
                      />
                    </label>
                    {newMedicine.image && <span className="file-name">{newMedicine.image.name}</span>}
                    <button type="submit" className="btn-submit">Добавить</button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Inventory;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import AuthHeader from '../../components/AuthHeader';
import Footer from '../../components/Footer';
import './Profile.css';
import LoadingScreen from '../../components/LoadingScreen';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
    } else {
      setUser(user);
      setAvatarUrl(user.user_metadata?.avatar_url);
    }
    setLoading(false);
  };

  const uploadAvatar = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: data.publicUrl }
      });

      if (updateError) throw updateError;

      setAvatarUrl(data.publicUrl);
      alert('Фото обновлено!');
    } catch (error) {
      alert('Ошибка: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <>
      <AuthHeader />
      <div className="profile-page">
        <div className="profile-container">
          <h1>Мой профиль</h1>
          <div className="avatar-section">
            <div className="avatar">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" />
              ) : (
                <div className="avatar-placeholder">👤</div>
              )}
            </div>
            <label className="btn-upload">
              {uploading ? 'Загрузка...' : 'Изменить фото'}
              <input type="file" accept="image/*" onChange={uploadAvatar} disabled={uploading} />
            </label>
          </div>
          <div className="profile-info">
            <div className="info-item">
              <span>ФИО:</span>
              <strong>{user?.user_metadata?.name || 'Не указано'}</strong>
            </div>
            <div className="info-item">
              <span>Email:</span>
              <strong>{user?.email}</strong>
            </div>
            <div className="info-item">
              <span>Телефон:</span>
              <strong>{user?.user_metadata?.phone || 'Не указано'}</strong>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>Выйти из аккаунта</button>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Profile;

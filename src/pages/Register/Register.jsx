import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import eyeIcon from '../../asset/icons/eye.png';
import '../Login/Login.css';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isFormValid = () => formData.name.trim() !== '' && formData.email.trim() !== '' && formData.password.trim() !== '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;
    if (formData.password.length < 6) {
      setMessage('Пароль должен быть минимум 6 символов');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: { data: { name: formData.name, phone: formData.phone } }
      });
      if (error) throw error;
      setMessage('Регистрация успешна!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setMessage(error.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="page-wrapper">
        <div className="image-side"></div>
        <div className="auth-container">
          <div className="form-main">
            <div className="form-header">
              <h2 className="form-title">Регистрация</h2>
            </div>

            <form className="form-fields-container" onSubmit={handleSubmit}>
              <div className="inputs-group">
                <div className="fields-group">
                  <div className="field-wrapper">
                    <label className="field-label">ФИО</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="field-input"
                      required
                    />
                  </div>

                  <div className="field-wrapper">
                    <label className="field-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="field-input"
                      required
                    />
                  </div>

                  <div className="field-wrapper">
                    <label className="field-label">Телефон</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="field-input"
                      placeholder="+7 (___) ___-__-__"
                    />
                  </div>

                  <div className="field-wrapper">
                    <label className="field-label">Пароль</label>
                    <div className="password-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="field-input password-input"
                        required
                      />
                      <button
                        type="button"
                        className={`eye-button ${showPassword ? 'eye-button-active' : ''}`}
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                      >
                        <img src={eyeIcon} alt="" className="eye-image" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {message && <p className="auth-message">{message}</p>}

              <div className="button-group">
                <button
                  type="submit"
                  className="register-btn"
                  disabled={!isFormValid() || loading}
                  style={{ opacity: (!isFormValid() || loading) ? 0.5 : 1, cursor: (!isFormValid() || loading) ? 'not-allowed' : 'pointer' }}
                >
                  {loading ? 'Загрузка...' : 'Зарегистрироваться'}
                </button>
              </div>
            </form>

            <div className="form-footer">
              <div className="divider-row">
                <div className="divider-line"></div>
                <p className="divider-text">или</p>
                <div className="divider-line"></div>
              </div>
              <div className="login-link-row">
                Уже есть аккаунт?
                <span className="login-link" onClick={() => navigate('/login')}>
                  Войти
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;

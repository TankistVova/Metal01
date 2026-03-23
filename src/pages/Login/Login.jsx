import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import eyeIcon from '../../asset/icons/eye.png';
import logoReg from '../../asset/auth/Logo Reg-Auto.png';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isFormValid = () => formData.email.trim() !== '' && formData.password.trim() !== '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;
    setLoading(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password
      });
      if (error) {
        throw new Error(error.message.includes('Invalid login credentials') ? 'Неверный email или пароль' : error.message);
      }
      setTimeout(() => navigate('/profile'), 500);
    } catch (error) {
      setMessage(error.message || 'Ошибка входа');
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
              <img src={logoReg} alt="Logo" className="auth-logo" />
              <h2 className="form-title">Вход в аккаунт</h2>
            </div>

            <form className="form-fields-container" onSubmit={handleSubmit}>
              <div className="inputs-group">
                <div className="fields-group">
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
                    <div className="link-wrapper">
                      <span className="link" onClick={() => navigate('/forgotPasswordEmail')}>
                        Забыли пароль?
                      </span>
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
                  {loading ? 'Загрузка...' : 'Войти'}
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
                Нет аккаунта?
                <span className="login-link" onClick={() => navigate('/register')}>
                  Зарегистрироваться
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

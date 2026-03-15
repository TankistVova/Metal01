import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import logo from '../../asset/logo.svg';
import '../Login/Login.css';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (password.length < 6) {
      setMessage('Пароль должен быть минимум 6 символов');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: { data: { name, phone } }
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
    <div className="login-page">
      <div className="login-container">
        <div className="login-form">
          <h2>Регистрация</h2>
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>ФИО</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Телефон</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (___) ___-__-__"
              />
            </div>
            <div className="form-group">
              <label>Пароль</label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️🗨️'}
                </button>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? 'Загрузка...' : 'Зарегистрироваться'}
              </button>
            </div>
          </form>
          {message && <p className="message">{message}</p>}
          <p className="toggle-text">
            Уже есть аккаунт? <span onClick={() => navigate('/login')}>Войти</span>
          </p>
        </div>
      </div>
      <div className="login-right">
        <img src={logo} alt="Logo" />
      </div>
    </div>
  );
}

export default Register;

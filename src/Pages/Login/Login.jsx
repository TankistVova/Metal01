import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import logo from '../../asset/logo.svg';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!email || !password) {
      setMessage('Заполните все поля');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password: password 
      });
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Неверный email или пароль');
        }
        throw error;
      }
      
      setMessage('Вход выполнен успешно!');
      setTimeout(() => navigate('/profile'), 1000);
    } catch (error) {
      setMessage(error.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-form">
          <h2>Вход</h2>
          <form onSubmit={handleLogin}>
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
                {loading ? 'Загрузка...' : 'Войти'}
              </button>
            </div>
          </form>
          {message && <p className="message">{message}</p>}
          <div className="social-login">
            <p>Войти с помощью</p>
            <div className="social-buttons">
              <button className="social-btn google">🔍</button>
              <button className="social-btn vk">VK</button>
            </div>
          </div>
          <p className="toggle-text">
            Нет аккаунта? <span onClick={() => navigate('/register')}>Зарегистрироваться</span>
          </p>
        </div>
      </div>
      <div className="login-right">
        <img src={logo} alt="Logo" />
      </div>
    </div>
  );
}

export default Login;

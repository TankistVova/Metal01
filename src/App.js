import { Routes, Route } from 'react-router-dom';
import './App.css';
import Header from './components/Navbar';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Profile from './pages/Profile/Profile';
import Inventory from './pages/Inventory/Inventory';
import InviteAccept from './pages/CreateAptechka/InviteAccept.jsx';
import Footer from './components/Footer';
import icon1 from './asset/icons/icon-medkit.png'
import icon2 from './asset/icons/icon-personal.png'
import icon3 from './asset/icons/icon-document.png'
import checkIcon from './asset/icons/check.png'
import plusIcon from './asset/icons/plus.png'
import stat247 from './asset/icons/stat-24-7.png'
import statUsers from './asset/icons/stat-users.png'
import statHospitals from './asset/icons/stat-hospitals.png'
import statPartners from './asset/icons/stat-partners.png'
import pharmacyHome from './asset/icons/pharmacy-home.png'
import pharmacyTravel from './asset/icons/pharmacy-travel.png'
import pharmacyKids from './asset/icons/pharmacy-kids.png'
import pharmacyRoad from './asset/icons/pharmacy-road.png'
import phoneImg from './asset/phone/phones.png'
import phoneImg1 from './asset/phone/phone.png'
import phoneContent from './asset/phone/phone-content.png'
import phoneBangs from './asset/phone/phone-bangs.png'
import phoneAitContent from './asset/phone/phone-air-content.png'
import { useEffect, useState } from 'react';
import SplashScreen from './components/SplashScreen';
import { supabase } from './supabaseClient';
import phoneAirQr from './asset/phone/phone-air-qr.png';
import messageChatIcon from './asset/icons/message-chat-square.png'
import pieChartIcon from './asset/icons/icon-pie-chart.png'
import fioIcon from './asset/icons/icons-reg-FIO.png'
import emailIcon from './asset/icons/icon-mail-reg.png'
import phoneIcon from './asset/icons/icon-phone-reg.png'
import logo from './asset/logo.svg'

function HomePage() {
  const scrollToRegistration = () => {
    const registrationSection = document.querySelector('.registration');
    if (registrationSection) {
      registrationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.scroll-animate').forEach(el => observer.observe(el));
    
    return () => observer.disconnect();
  }, []);

  return (
    <div className="App">
      {/* Декоративные кружочки на заднем фоне */}
      <div className="circle-1"></div>
      <div className="circle-2"></div>
      <div className="circle-3"></div>
      <div className="circle-4"></div>
      
      <Header />
      
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-left">
              <h1>Технологичный Подход<br />К Вашей Аптечке</h1>
              <p>Ваш помощник, который упрощает контроль<br />и организацию медицинских запасов.</p>
              <br/>
              <button className="btn-primary" onClick={() => window.location.href = '/register'}>Зарегистрироваться</button>
            </div>
            <div className="hero-right">
              <div className="phone-container">
                <img src={phoneImg1} alt="Phone App" className="hero-phone" />
                <img src={phoneContent} alt="Phone Content" className="phone-content" />
                <img src={phoneAitContent} alt="Phone AIT Content" className="phone-ait-content" />
                <img src={phoneAirQr} alt="Phone Air QR" className="phone-air-qr" />
                <img src={phoneBangs} alt="Phone Bangs" className="phone-bangs" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features scroll-animate">
        <div className="features-container">
          <div className="feature-card">
            <div className="feature-icon">
              <img src={icon1} alt="" />
            </div>
            <h3>Создать аптечку</h3>
            <p>Добавьте аптечки которые у вас есть с категориями</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <img src={icon2} alt="" />
            </div>
            <h3>Добавить запись к врачу</h3>
            <p>Запишитесь онлайн прямо через наше приложение к нужному специалисту</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <img src={icon3} alt="" />
            </div>
            <h3>Online регистрация</h3>
            <p>Зарегистрируйтесь бесплатно и начните пользоваться всеми функциями</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section scroll-animate">
        <div className="stats-container">
          <div className="phones-container">
            <div className="section-label">Коротко о нас</div>
            <h2>Мы предоставляем исключительное<br />удобство <span className="highlight">с учетом потребностей<br />пользователя</span></h2>
            <img src={phoneImg} alt="Phones" className="phones-image" />
          </div>
          <div className="stats">
            <div className="stat-item">
              <div className="stat-icon"><img src={stat247} alt="" /></div>
              <div className="stat-number">24/7</div>
              <div className="stat-text">Доступность в любое время</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon"><img src={statUsers} alt="" /></div>
              <div className="stat-number">12.6K +</div>
              <div className="stat-text">Уже используют сервис</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon"><img src={statHospitals} alt="" /></div>
              <div className="stat-number">1200 +</div>
              <div className="stat-text">Больниц сотрудничающих с нами</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon"><img src={statPartners} alt="" /></div>
              <div className="stat-number">220 +</div>
              <div className="stat-text">Партнеров, которые рекомендуют нас</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pharmacy Types Section */}
      <section className="pharmacy-types scroll-animate">
        <div className="pharmacy-container">
          <div className="section-label">Аптечки</div>
          <h2>Возможность создавать множество <br/> аптечек под разными нуждами</h2>
          <p className="pharmacy-subtitle">Доступно только после регистрации</p>
          <div className="learn-more-btn">Узнать подробнее →</div>
          <div className="types-grid">
            <div className="type-card">
              <div className="type-icon"><img src={pharmacyHome} alt="" /></div>
              <h3>Домашняя аптечка</h3>
              <ul>
                <li>Обезболивающие</li>
                <li>Сосудосуживающие</li>
                <li>Жаропонижающие</li>
                <li>Для пищеварения</li>
              </ul>
            </div>
            <div className="type-card">
              <div className="type-icon"><img src={pharmacyTravel} alt="" /></div>
              <h3>Аптечка в путешествие</h3>
              <ul>
                <li>Обезболивающие</li>
                <li>Для пищеварения</li>
              </ul>
            </div>
            <div className="type-card">
              <div className="type-icon"><img src={pharmacyKids} alt="" /></div>
              <h3>Детская аптечка</h3>
              <ul>
                <li>Обезболивающие</li>
                <li>Сосудосуживающие</li>
                <li>Для пищеварения</li>
                <li>Жаропонижающие</li>
              </ul>
            </div>
            <div className="type-card">
              <div className="type-icon"><img src={pharmacyRoad} alt="" /></div>
              <h3>Дорожная аптечка</h3>
              <ul>
                <li>Обезболивающие</li>
                <li>Сосудосуживающие</li>
                <li>Для пищеварения</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits scroll-animate">
        <div className="benefits-container">
          <div className="section-label">Сервис</div>
          <h2>Большой выбор возможностей при<br />использовании нашего сервиса</h2>
          <p className="benefits-subtitle">Доступно только после регистрации</p>
          <div className="benefits-content">
            <div className="benefits-left">
              <h3>Организация аптечки -<br />Ваше здоровье</h3>
              <p>Мы предлагаем удобный в организации и в<br />использовании сервис, который будет всегда у вас<br />под рукой в минуту надобности</p>
              <button className="btn-primary" onClick={scrollToRegistration}>Начать использовать</button>
            </div>
            <div className="benefits-right">
              <div className="benefit-item">
                <div className="benefit-icon"><img src={plusIcon} alt="" /></div>
                <h4>Добавление и учёт<br />лекарств</h4>
                <p>Добавляйте лекарства<br />вручную или отсканируйте<br />QR Code на чеке</p>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon"><img src={pieChartIcon} alt="" width="32" height="32" /></div>
                <div>
                  <h4>Гибкая <br/>категоризация</h4>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon"><img src={messageChatIcon} alt="" width="32" height="32" /></div>
                <div>
                  <h4>Автоматические уведомления</h4>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon"><img src={icon2} alt="" /></div>
                <h4>Семейный<br />доступ</h4>
                <p>Добавление и учёт лекарств</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Section */}
      <section className="registration scroll-animate">
        <div className="pills-wrapper">
          {['💊','🩺','💉','🩹','💊','🩺','💉','🩹'].map((icon, i) => (
            <span key={i} className="pill-float" style={{'--i': i}}>{icon}</span>
          ))}
        </div>
        <div className="registration-container">
          <div className="section-label">Регистрация</div>
          <h2>Для использования системы необходимо <br/>зарегистрироваться</h2>
          <button className="btn-primary" onClick={() => window.location.href = '/register'}>Зарегистрироваться</button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().finally(() => setLoading(false));
  }, []);

  return (
    <>
      {loading && <SplashScreen />}
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/inventory" element={<Inventory />} />
      <Route path="/invites" element={<InviteAccept />} />
    </Routes>
    </>
  );
}

export default App;

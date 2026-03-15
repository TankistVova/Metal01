import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import logo from '../asset/logo.svg';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollToRegistration = () => {
    const registrationSection = document.querySelector('.registration');
    if (registrationSection) {
      registrationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="logo">
          <img src={logo} alt="Цифровая Аптечка" />
        </div>
        
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>

        <ul className={`menu ${menuOpen ? 'active' : ''}`}>
          <li><a href="/">Главная</a></li>
          <li><a href="/about">Коротко о нас</a></li>
          <li><a href="/pharmacy">Аптечки</a></li>
          <li><a href="/service">Сервис</a></li>
        </ul>

        <div className="navbar-right">
          <Link to="/login"><button className="login-button">Войти</button></Link>
          <button className="register-button" onClick={scrollToRegistration}>Зарегистрироваться</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
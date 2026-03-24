import React from 'react';
import logo from '../asset/logo.svg';
import phoneIcon from '../asset/icons/Icon-phone-contact.png';
import mailIcon from '../asset/icons/Icon-mail-contact.png';
import geoIcon from '../asset/icons/Icon-geo-point-contact.png';
import vkIcon from '../asset/icons/Icon-vk.png';
import whatsAppIcon from '../asset/icons/Icon-whatsApp.png';
import tikTokIcon from '../asset/icons/Icon-TikTok.png';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <img src={logo} alt="Logo" />
            </div>
            <p>Технологичный подход к вашей аптечке. Ваш помощник, который упрощает контроль и организацию медицинских запасов.</p>
          </div>
          <div className="footer-section">
            <h4>КОМПАНИЯ</h4>
            <ul>
              <li>Главная</li>
              <li>Коротко о нас</li>
              <li>Аптечки</li>
              <li>Сервис</li>
              <li>FAQ</li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>CONTACTS</h4>
            <ul>
              <li><img src={mailIcon} alt="Mail" className="footer-contact-icon" />smorgun@sfedu.ru</li>
              <li><img src={geoIcon} alt="Location" className="footer-contact-icon" />Taganrog, SFEDU</li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>СОЦ. СЕТИ</h4>
            <div className="social-links">
              <img src={vkIcon} alt="VK" className="social-icon-img" />
              <img src={whatsAppIcon} alt="WhatsApp" className="social-icon-img" />
              <img src={tikTokIcon} alt="TikTok" className="social-icon-img" />
            </div>
          </div>
        </div>
        <div className="footer-mobile">
          <div className="footer-mobile-top">
            <div className="footer-logo">
              <img src={logo} alt="Logo" />
            </div>
            <div className="footer-mobile-right">
              <div className="social-links">
                <img src={vkIcon} alt="VK" className="social-icon-img" />
                <img src={whatsAppIcon} alt="WhatsApp" className="social-icon-img" />
                <img src={tikTokIcon} alt="TikTok" className="social-icon-img" />
              </div>
              <ul className="footer-mobile-contacts">
                <li><img src={mailIcon} alt="Mail" className="footer-contact-icon" />smorgun@sfedu.ru</li>
                <li><img src={geoIcon} alt="Location" className="footer-contact-icon" />Taganrog, SFEDU</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>Авторские права © 2026. I'm HZ. Все права защищены</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
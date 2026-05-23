import logo from '../asset/logo.svg';
import './SplashScreen.css';

export default function SplashScreen() {
  return (
    <div className="splash">
      <img src={logo} alt="Аптечка" className="splash__logo" />
      <div className="splash__dots">
        <span /><span /><span />
      </div>
    </div>
  );
}

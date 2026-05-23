import './LoadingScreen.css';

function LoadingScreen() {
  return (
    <div className="loading">
      <div className="loading-pill">💊</div>
      <div className="loading-bar"><div className="loading-bar-fill"></div></div>
    </div>
  );
}

export default LoadingScreen;


import './Header.css';

const Header = ({ onNavigation }) => {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="logo-container">
          <a href="/" className="logo-link" aria-label="Go to Dashboard" onClick={(e) => {
            e.preventDefault();
            onNavigation('dashboard');
          }}>
            <h1 className="logo">BioPlot</h1>
          </a>
          <span className="tagline">Biological Visualization Platform</span>
        </div>
        
        <nav className="main-nav">
          <ul className="nav-list">
            <li className="nav-item">
              <a href="/dashboard" className="nav-link" aria-label="Go to Dashboard" onClick={(e) => {
                e.preventDefault();
                onNavigation('dashboard');
              }}>
                Dashboard
              </a>
            </li>
            <li className="nav-item">
              <a href="/graph-registry" className="nav-link" aria-label="Go to Graph Registry" onClick={(e) => {
                e.preventDefault();
                onNavigation('graph-registry');
              }}>
                Graph Registry
              </a>
            </li>
            <li className="nav-item">
              <a href="/about" className="nav-link" aria-label="Go to About page" onClick={(e) => {
                e.preventDefault();
                onNavigation('about');
              }}>
                About
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;

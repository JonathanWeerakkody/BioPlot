import React from 'react';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <h1>BioPlot</h1>
          <span className="tagline">Biological Data Visualization</span>
        </div>
        <nav className="nav">
          <ul>
            <li><a href="https://github.com/YourUsername/BioPlot" target="_blank" rel="noopener noreferrer">GitHub</a></li>
            <li><a href="#about">About</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Header;

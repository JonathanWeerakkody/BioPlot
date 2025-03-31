import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>BioPlot - Simple Biological Data Visualization</p>
        <p className="copyright">© {new Date().getFullYear()} BioPlot</p>
      </div>
    </footer>
  );
}

export default Footer;

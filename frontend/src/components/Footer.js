import React from 'react';

function Footer() {
  return (
    <footer className="footer">
      <p>BioPlot - Biological Visualization Platform</p>
      <p>
        <small>
          &copy; {new Date().getFullYear()} | 
          <a href="https://github.com/YourUsername/BioPlot" target="_blank" rel="noopener noreferrer" className="ml-2">
            GitHub
          </a>
        </small>
      </p>
    </footer>
  );
}

export default Footer;

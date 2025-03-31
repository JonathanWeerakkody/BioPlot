import React from 'react';

function Section({ title, children }) {
  return (
    <div className="section">
      <div className="section-title">
        <h2>{title}</h2>
      </div>
      <div className="section-content">
        {children}
      </div>
    </div>
  );
}

export default Section;

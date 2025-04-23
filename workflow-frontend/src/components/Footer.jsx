import React from 'react';
import './comp styles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>&copy; {new Date().getFullYear()} Workflow Manager. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
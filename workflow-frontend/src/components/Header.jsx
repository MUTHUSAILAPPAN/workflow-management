import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../services/auth';
import './comp styles/Header.css';

const Header = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-logo">
        <h1>Workflow Manager</h1>
      </div>
      <div className="header-user">
        {user && (
          <>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-role">{user.role}</span>
            </div>
            <button onClick={handleLogout} className="logout-button">Logout</button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
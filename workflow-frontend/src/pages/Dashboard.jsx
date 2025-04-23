import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../services/auth';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './page styles/Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="dashboard-container">
      <Header />
      <main className="dashboard-content">
        <div className="user-info-card">
          <h2>Welcome, {user.name}</h2>
          <div className="user-details">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>User ID:</strong> {user.id}</p>
          </div>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
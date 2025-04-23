import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';
import './comp styles/Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const user = getCurrentUser();
  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';

  // Helper to determine if a link is active
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul>
          <li>
            <Link to="/dashboard" className={isActive('/dashboard')}>
              Dashboard
            </Link>
          </li>
          <li className="nav-section">
            <span className="section-title">Workflows</span>
            <ul>
              <li>
                <Link to="/workflows/create" className={isActive('/workflows/create')}>
                  Create Workflow
                </Link>
              </li>
              <li>
                <Link to="/workflows/my" className={isActive('/workflows/my')}>
                  My Workflows
                </Link>
              </li>
              <li>
                <Link to="/workflows/all" className={isActive('/workflows/all')}>
                  All Workflows
                </Link>
              </li>
            </ul>
          </li>
          <li className="nav-section">
            <span className="section-title">Users</span>
            <ul>
              <li>
                <Link to="/users" className={isActive('/users')}>
                  Manage Users
                </Link>
              </li>
              {(isAdmin || isManager) && (
                <li>
                  <Link to="/users/create" className={isActive('/users/create')}>
                    Create User
                  </Link>
                </li>
              )}
            </ul>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import './index.css';

// Import the remaining components only when needed
const CreateUser = React.lazy(() => import('./pages/CreateUser'));
const ManageUsers = React.lazy(() => import('./pages/ManageUsers'));
const CreateWorkflow = React.lazy(() => import('./pages/CreateWorkflow'));
const MyWorkflows = React.lazy(() => import('./pages/MyWorkflows'));
const AllWorkflows = React.lazy(() => import('./pages/AllWorkflows'));

// Create a NotFound component inline for now to avoid import issues
const NotFound = () => (
  <div className="not-found" style={{ textAlign: 'center', padding: '50px' }}>
    <h1>404</h1>
    <h2>Page Not Found</h2>
    <p>The page you are looking for doesn't exist or has been moved.</p>
    <a href="/dashboard" style={{ color: '#2196f3' }}>Return to Dashboard</a>
  </div>
);

// Simple protected route implementation
const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem('user');
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <React.Suspense fallback={<div className="loading">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <App>
                <Dashboard />
              </App>
            </ProtectedRoute>
          } />
          
          <Route path="/users" element={
            <ProtectedRoute>
              <App>
                <ManageUsers />
              </App>
            </ProtectedRoute>
          } />
          
          <Route path="/users/create" element={
            <ProtectedRoute>
              <App>
                <CreateUser />
              </App>
            </ProtectedRoute>
          } />
          
          <Route path="/workflows/create" element={
            <ProtectedRoute>
              <App>
                <CreateWorkflow />
              </App>
            </ProtectedRoute>
          } />
          
          <Route path="/workflows/my" element={
            <ProtectedRoute>
              <App>
                <MyWorkflows />
              </App>
            </ProtectedRoute>
          } />
          
          <Route path="/workflows/all" element={
            <ProtectedRoute>
              <App>
                <AllWorkflows />
              </App>
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  </React.StrictMode>
);
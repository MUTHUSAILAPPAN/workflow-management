import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();
  
  // If user is not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If no specific roles are required, allow access
  if (!requiredRoles.length) {
    return children;
  }
  
  // Check if user has required role
  const hasRequiredRole = requiredRoles.includes(currentUser.role);
  
  if (!hasRequiredRole) {
    // Redirect to dashboard or unauthorized page
    return <Navigate to="/dashboard" replace />;
  }
  
  // User is authenticated and has the required role
  return children;
};

export default ProtectedRoute;
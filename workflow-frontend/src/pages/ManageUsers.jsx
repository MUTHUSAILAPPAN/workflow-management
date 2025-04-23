import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserService from '../services/UserService';
import AuthService from '../services/authService';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import '../pages/page styles/ManageUsers.css';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const navigate = useNavigate();

  // Safe user data extraction with additional fields
  const getSafeUserData = (user) => {
    if (!user) return null;
    return {
      id: user.id || '',
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'STAFF',
      createdBy: user.createdBy || 'System',
      createdAt: user.createdAt || '',
      username: user.username || '' // Keeping for internal use
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUserAuth = AuthService.getCurrentUser();
        if (!currentUserAuth || !currentUserAuth.role) {
          navigate('/login');
          return;
        }

        // Get full user details
        const userDetails = await UserService.getUserById(currentUserAuth.id);
        setCurrentUser(userDetails);
        setCurrentUserRole(userDetails.role);

        let fetchedUsers = [];

        if (userDetails.role === 'ADMIN') {
          fetchedUsers = await UserService.getAllUsers();
        } else if (userDetails.role === 'MANAGER') {
          const [managers, staff] = await Promise.all([
            UserService.getUsersByRole('MANAGER'),
            UserService.getUsersByRole('STAFF')
          ]);
          fetchedUsers = [...managers, ...staff];
        } else {
          fetchedUsers = await UserService.getUsersByRole('STAFF');
        }

        // Validate and normalize user data
        const validatedUsers = fetchedUsers
          .map(getSafeUserData)
          .filter(user => user !== null);

        setUsers(validatedUsers);
      } catch (err) {
        console.error('User fetch error:', err);
        setError(err.message || 'Failed to load users. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const filteredUsers = users.filter(user => {
    if (!user) return false;

    const searchFields = [
      user.name?.toLowerCase() || '',
      user.email?.toLowerCase() || '',
      user.role?.toLowerCase() || '',
      (typeof user.createdBy === 'string' ? user.createdBy.toLowerCase() : '')
    ].join(' ');

    const matchesSearch = searchFields.includes(searchTerm.toLowerCase());
    const matchesRole = filterRole ? user.role === filterRole : true;

    return matchesSearch && matchesRole;
  });

  const handleCreateUser = () => navigate('/users/create');
  
  const handleEditClick = (user) => {
    setEditingUser({
      ...user,
      originalRole: user.role // Store the original role to detect changes
    });
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const handleConfirmDelete = async () => {
    try {
      // According to the backend, we need to call deleteUser with the userId parameter
      await UserService.deleteUser(userToDelete.id);
      
      // Update local state on success
      setUsers(users.filter(user => user.id !== userToDelete.id));
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      console.error('Delete user error:', err);
      setError(`Failed to delete user: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    
    try {
      // First update basic user info (name, email)
      const userUpdateData = {
        name: editingUser.name,
        email: editingUser.email
      };
      
      const updatedUser = await UserService.updateUser(editingUser.id, userUpdateData);
      let finalUser = getSafeUserData(updatedUser);
      
      // If role has been changed and current user is ADMIN, make a separate call
      // to update the role using the specific endpoint
      if (
        currentUserRole === 'ADMIN' && 
        editingUser.originalRole !== editingUser.role &&
        currentUser.id !== editingUser.id
      ) {
        try {
          // Need to add this method to your UserService
          const roleUpdateResult = await UserService.changeUserRole(editingUser.id, editingUser.role);
          finalUser = getSafeUserData(roleUpdateResult);
          console.log('Role updated successfully:', roleUpdateResult);
        } catch (roleErr) {
          console.error('Error updating role:', roleErr);
          setError(`User info updated but role change failed: ${roleErr.response?.data?.message || roleErr.message}`);
          // Still update the users list with the basic info we did manage to update
        }
      }
      
      // Update local state with the returned user data
      setUsers(users.map(user => 
        user.id === finalUser.id ? finalUser : user
      ));
      
      setEditingUser(null);
    } catch (err) {
      console.error('Update user error:', err);
      setError(`Failed to update user: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditingUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Determine if current user can edit or delete the target user
  const canManageUser = (targetUser) => {
    if (!currentUser || !targetUser) return false;
    
    // Users can edit themselves
    if (currentUser.id === targetUser.id) return true;
    
    // ADMIN can manage everyone
    if (currentUserRole === 'ADMIN') return true;
    
    // MANAGER can manage STAFF only
    if (currentUserRole === 'MANAGER' && targetUser.role === 'STAFF') return true;
    
    return false;
  };

  // Determine if current user can delete the target user
  const canDeleteUser = (targetUser) => {
    if (!currentUser || !targetUser) return false;
    
    // Users cannot delete themselves
    if (currentUser.id === targetUser.id) return false;
    
    // ADMIN can delete anyone except themselves
    if (currentUserRole === 'ADMIN') return true;
    
    // MANAGER can delete STAFF only
    if (currentUserRole === 'MANAGER' && targetUser.role === 'STAFF') return true;
    
    return false;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="manage-users-container">
      <div className="users-header">
        <h2>Manage Users</h2>
        {(currentUserRole === 'ADMIN' || currentUserRole === 'MANAGER') && (
          <button className="create-user-btn" onClick={handleCreateUser}>
            Create New User
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      <div className="filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="role-filter">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            aria-label="Filter by role"
          >
            <option value="">All Roles</option>
            {currentUserRole === 'ADMIN' && <option value="ADMIN">Admin</option>}
            {(currentUserRole === 'ADMIN' || currentUserRole === 'MANAGER') && (
              <option value="MANAGER">Manager</option>
            )}
            <option value="STAFF">Staff</option>
          </select>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="no-users-message">
          <p>No users found matching your criteria</p>
          <button onClick={() => {
            setSearchTerm('');
            setFilterRole('');
          }}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created By</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.name || '-'}</td>
                  <td>{user.email || '-'}</td>
                  <td>
                    <span className={`role-badge ${user.role?.toLowerCase()}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{user.createdBy || 'System'}</td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td className="action-buttons">
                    <button
                      className="edit-btn"
                      onClick={() => handleEditClick(user)}
                      disabled={!canManageUser(user)}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteClick(user)}
                      disabled={!canDeleteUser(user)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingUser && (
        <div className="edit-user-overlay">
          <div className="edit-user-modal">
            <h3>Edit User</h3>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={editingUser.name || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={editingUser.email || ''}
                onChange={handleInputChange}
              />
            </div>
            {currentUserRole === 'ADMIN' && currentUser.id !== editingUser.id && (
              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  value={editingUser.role || 'STAFF'}
                  onChange={handleInputChange}
                >
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="STAFF">Staff</option>
                </select>
              </div>
            )}
            <div className="edit-modal-actions">
              <button className="cancel-btn" onClick={handleCancelEdit}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleSaveEdit}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <DeleteConfirmationModal
          title={userToDelete?.name || "this user"}
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          entityType="user"
        />
      )}
    </div>
  );
};

export default ManageUsers;
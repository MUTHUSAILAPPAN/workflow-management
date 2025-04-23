//WorkflowDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import workflowService from '../services/WorkflowService';
import userService from '../services/UserService';
import authService from '../services/authService';
import './comp styles/WorkflowDetail.css';

const WorkflowDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [editableWorkflow, setEditableWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch workflow details
        const fetchedWorkflow = await workflowService.getWorkflowById(id);
        setWorkflow(fetchedWorkflow);
        setEditableWorkflow({
          ...fetchedWorkflow,
          assigneeId: fetchedWorkflow.assignee.id
        });

        // Fetch available users for assignment based on role
        let users = [];
        if (currentUser.role === 'ADMIN') {
          // Admins can assign to anyone
          users = await userService.getAllUsers();
        } else if (currentUser.role === 'MANAGER') {
          // Managers can assign to managers and staff
          const managers = await userService.getUsersByRole('MANAGER');
          const staff = await userService.getUsersByRole('STAFF');
          users = [...managers, ...staff];
        } else {
          // Staff can only assign to other staff
          users = await userService.getUsersByRole('STAFF');
        }
        setAvailableUsers(users);
      } catch (err) {
        setError('Failed to load workflow details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate, currentUser]);

  const canEditAllFields = () => {
    if (!workflow || !currentUser) return false;
    
    // Admin can edit all workflows
    if (currentUser.role === 'ADMIN') return true;
    
    // Users can edit workflows they created
    return workflow.creator.id === currentUser.id;
  };

  const canUpdateStatus = () => {
    if (!workflow || !currentUser) return false;
    
    // Admin can update status of any workflow
    if (currentUser.role === 'ADMIN') return true;
    
    // Creator can update status
    if (workflow.creator.id === currentUser.id) return true;
    
    // Assignee can update status
    return workflow.assignee.id === currentUser.id;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditableWorkflow(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setError('');
      setSuccess('');

      // Format data for API
      const workflowToSubmit = {
        ...editableWorkflow,
        assignee: { id: editableWorkflow.assigneeId }
      };
      delete workflowToSubmit.assigneeId;

      const updatedWorkflow = await workflowService.updateWorkflow(id, workflowToSubmit);
      setWorkflow(updatedWorkflow);
      setEditableWorkflow({
        ...updatedWorkflow,
        assigneeId: updatedWorkflow.assignee.id
      });
      setIsEditing(false);
      setSuccess('Workflow updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update workflow');
    }
  };

  if (loading) {
    return <div className="loading">Loading workflow details...</div>;
  }

  if (!workflow) {
    return <div className="error-message">Workflow not found</div>;
  }

  return (
    <div className="workflow-detail-container">
      <div className="workflow-header">
        <h2>{isEditing ? 'Edit Workflow' : 'Workflow Details'}</h2>
        <div className="action-buttons">
          {!isEditing && (canEditAllFields() || canUpdateStatus()) && (
            <button className="edit-btn" onClick={() => setIsEditing(true)}>
              Edit
            </button>
          )}
          <button className="back-btn" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <div className="workflow-content">
        {isEditing ? (
          <div className="edit-form">
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={editableWorkflow.title}
                onChange={handleChange}
                disabled={!canEditAllFields()}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={editableWorkflow.description}
                onChange={handleChange}
                rows="4"
                disabled={!canEditAllFields()}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={editableWorkflow.status}
                onChange={handleChange}
                disabled={!canUpdateStatus()}
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            
            {canEditAllFields() && (
              <div className="form-group">
                <label htmlFor="assigneeId">Assigned To</label>
                <select
                  id="assigneeId"
                  name="assigneeId"
                  value={editableWorkflow.assigneeId}
                  onChange={handleChange}
                >
                  <option value="">Select a user</option>
                  {availableUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.username}) - {user.role}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="form-actions">
              <button className="save-btn" onClick={handleSave}>
                Save Changes
              </button>
              <button className="cancel-btn" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="workflow-details">
            <div className="detail-row">
              <span className="label">Title:</span>
              <span className="value">{workflow.title}</span>
            </div>
            
            <div className="detail-row">
              <span className="label">Description:</span>
              <span className="value">{workflow.description || 'No description provided'}</span>
            </div>
            
            <div className="detail-row">
              <span className="label">Status:</span>
              <span className={`status-badge ${workflow.status.toLowerCase()}`}>
                {workflow.status}
              </span>
            </div>
            
            <div className="detail-row">
              <span className="label">Created By:</span>
              <span className="value">
                {`${workflow.creator.firstName || ''} ${workflow.creator.lastName || ''} (${workflow.creator.username})`}
              </span>
            </div>
            
            <div className="detail-row">
              <span className="label">Assigned To:</span>
              <span className="value">
                {`${workflow.assignee.firstName || ''} ${workflow.assignee.lastName || ''} (${workflow.assignee.username})`}
              </span>
            </div>
            
            <div className="detail-row">
              <span className="label">Created On:</span>
              <span className="value">{new Date(workflow.createdAt).toLocaleString()}</span>
            </div>
            
            <div className="detail-row">
              <span className="label">Last Updated:</span>
              <span className="value">{new Date(workflow.updatedAt).toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowDetail;
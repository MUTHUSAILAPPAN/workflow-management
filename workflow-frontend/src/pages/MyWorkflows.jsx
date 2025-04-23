import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkflowService from '../services/WorkflowService';
import AuthService from '../services/authService';
import UserService from '../services/UserService'; // Add this import
import WorkflowDetailModal from './WorkflowDetailModal';
import WorkflowEditModal from './WorkflowEditModal';
import './page styles/MyWorkflows.css';
import CreateWorkflow from './CreateWorkflow';

const MyWorkflows = () => {
  const [assignedWorkflows, setAssignedWorkflows] = useState([]);
  const [createdWorkflows, setCreatedWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('assigned');
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [users, setUsers] = useState([]); // State to store users for EditModal
  
  // Modal state
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const navigate = useNavigate();

  // Load users data for EditModal
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const fetchedUsers = await UserService.getAllUsers();
        setUsers(fetchedUsers || []);
      } catch (err) {
        console.error('Failed to load users:', err);
        // Don't set error state since this is not critical for the main page functionality
        setUsers([]); // Set empty array as fallback
      }
    };
    
    loadUsers();
  }, []);

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const user = AuthService.getCurrentUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setCurrentUser(user);
  
      // Build proper query parameters
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter.toUpperCase());
      
      // For assigned workflows
      const assignedResult = await WorkflowService.getMyAssignedWorkflows(params);
      setAssignedWorkflows(assignedResult || []);
  
      // For created workflows
      const createdResult = await WorkflowService.getMyCreatedWorkflows(params);
      setCreatedWorkflows(createdResult || []);
    } catch (err) {
      console.error('Error fetching workflows:', err);
      setError(err.response?.data?.message || 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  }, [navigate, statusFilter]);

  // Initial data loading
  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  // Handle status filter change
  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
  };

  // Handle search term change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

    // Navigate to workflow creation page
    const handleCreateWorkflow = () => {
      navigate('/workflows/create');
    };

  // Handle status update - Modified to use direct status update endpoint
  const handleStatusUpdate = async (workflowId, newStatus) => {
    try {
      // Get the full workflow before updating
      const workflowToUpdate = await WorkflowService.getWorkflowById(workflowId);
      
      // Update only the status field
      const updatedWorkflow = { 
        ...workflowToUpdate,
        status: newStatus
      };
      
      // Use updateWorkflow instead of updateWorkflowStatus
      await WorkflowService.updateWorkflow(workflowId, updatedWorkflow);
      
      // Refresh workflows after successful update
      fetchWorkflows();
    } catch (err) {
      console.error('Error updating workflow status:', err);
      if (err.response && err.response.status === 403) {
        setError('You do not have permission to update this workflow status.');
      } else {
        setError('Failed to update workflow status. Please try again.');
      }
      // Add a timeout to clear the error message after 3 seconds
      setTimeout(() => setError(''), 3000);
    }
  };

  // Open workflow detail modal
  const handleViewWorkflow = (workflow) => {
    setSelectedWorkflow(workflow);
    setShowDetailModal(true);
  };

  // Open workflow edit modal
  const handleEditWorkflow = (workflow) => {
    setSelectedWorkflow(workflow);
    setShowEditModal(true);
  };

  // Handle workflow deletion
  const handleWorkflowDeleted = (workflowId) => {
    // Update both workflow lists
    setCreatedWorkflows(createdWorkflows.filter(w => w.id !== workflowId));
    setAssignedWorkflows(assignedWorkflows.filter(w => w.id !== workflowId));
    setShowEditModal(false);
  };

// And update the handleWorkflowUpdate function to ensure both name and ID are preserved:
const handleWorkflowUpdate = (updatedWorkflow) => {
  // Make sure the assignedToName is preserved when updating the lists
  const completeWorkflow = {
    ...updatedWorkflow,
    // If assignedToName is not in the updated workflow but exists in the original one, keep it
    assignedToName: updatedWorkflow.assignedToName || 
      (createdWorkflows.find(w => w.id === updatedWorkflow.id)?.assignedToName ||
       assignedWorkflows.find(w => w.id === updatedWorkflow.id)?.assignedToName)
  };
  
  // Update both workflow lists if the workflow exists in them
  setCreatedWorkflows(createdWorkflows.map(wf => 
    wf.id === updatedWorkflow.id ? completeWorkflow : wf
  ));
  setAssignedWorkflows(assignedWorkflows.map(wf => 
    wf.id === updatedWorkflow.id ? completeWorkflow : wf
  ));
  setShowEditModal(false);
  // Also refresh data from API to ensure consistency
  fetchWorkflows();
};

  // Refresh data
  const handleRefresh = () => {
    fetchWorkflows();
  };

  // Apply filters to workflows
  const getFilteredWorkflows = (workflows) => {
    return workflows.filter(workflow => {
      const matchesSearch = searchTerm === '' || 
        (workflow.title && workflow.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (workflow.description && workflow.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesSearch;
    });
  };

  const filteredAssignedWorkflows = getFilteredWorkflows(assignedWorkflows);
  const filteredCreatedWorkflows = getFilteredWorkflows(createdWorkflows);

  // Current workflows based on active tab
  const currentWorkflows = activeTab === 'assigned' 
    ? filteredAssignedWorkflows 
    : filteredCreatedWorkflows;

  // Clear filters
  const clearFilters = () => {
    setStatusFilter('');
    setSearchTerm('');
  };

  // Check if current user can delete a workflow (only creators)
  const canDeleteWorkflow = (workflow) => {
    if (!currentUser || !workflow) return false;
    return workflow.createdBy === currentUser.id || workflow.createdBy === currentUser.username;
  };

  if (loading && assignedWorkflows.length === 0 && createdWorkflows.length === 0) {
    return <div className="loading">Loading your workflows...</div>;
  }

  return (
    <div className="my-workflows-container">
      <div className="workflows-header">
        <h2>My Workflows</h2>
        <div className="button-group">
          <button className="refresh-btn" onClick={handleRefresh}>
            Refresh
          </button>
          <button className="create-workflow-btn" onClick={handleCreateWorkflow}>
            Create New Workflow
          </button>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'assigned' ? 'active' : ''}`}
          onClick={() => setActiveTab('assigned')}
        >
          Assigned to Me ({assignedWorkflows.length})
        </button>
        <button 
          className={`tab ${activeTab === 'created' ? 'active' : ''}`}
          onClick={() => setActiveTab('created')}
        >
          Created by Me ({createdWorkflows.length})
        </button>
      </div>
      
      <div className="filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search workflows..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="filter-row">
          <div className="status-filter">
            <label>Status:</label>
            <select
              value={statusFilter}
              onChange={handleStatusChange}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <button className="apply-filters-btn" onClick={fetchWorkflows}>
            Apply Filters
          </button>
          {(statusFilter || searchTerm) && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      </div>
      
      {currentWorkflows.length === 0 ? (
        <div className="no-workflows">
          {activeTab === 'assigned' 
            ? 'No workflows assigned to you' 
            : 'You haven\'t created any workflows yet'}
          {(statusFilter || searchTerm) && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="workflows-table-container">
          <table className="workflows-table">
            <thead>
              <tr>
                <th>Title</th>
                {activeTab === 'created' && <th>Assigned To</th>}
                <th>Status</th>
                <th>Due Date</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentWorkflows.map(workflow => (
                <tr 
                  key={workflow.id}
                  onClick={() => handleViewWorkflow(workflow)}
                  className="workflow-row"
                  style={{ cursor: 'pointer' }}
                >
                  <td>{workflow.title}</td>
                  {activeTab === 'created' && <td>{workflow.assignedToName || workflow.assignedTo}</td>}
                  <td>
                    <span className={`status-badge ${workflow.status ? workflow.status.toLowerCase() : 'unknown'}`}>
                      {workflow.status || 'Unknown'}
                    </span>
                  </td>
                  <td>{workflow.dueDate ? new Date(workflow.dueDate).toLocaleDateString() : 'N/A'}</td>
                  <td>{workflow.createdAt ? new Date(workflow.createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {/* Different actions based on assigned vs created tab */}
                    {activeTab === 'assigned' ? (
                      <div className="status-actions">
                        <select 
                          className="status-select"
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleStatusUpdate(workflow.id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                        >
                          <option value="">Update Status</option>
                          <option value="PENDING">Pending</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      </div>
                    ) : (
                      <button 
                        className="edit-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditWorkflow(workflow);
                        }}
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Workflow Detail Modal */}
      {showDetailModal && selectedWorkflow && (
        <WorkflowDetailModal
          workflow={selectedWorkflow}
          onClose={() => setShowDetailModal(false)}
          onEdit={() => {
            setShowDetailModal(false);
            // Only allow editing if in the created tab or if the user is the workflow owner
            if (activeTab === 'created' || selectedWorkflow.createdBy === currentUser?.id) {
              setShowEditModal(true);
            }
          }}
          canEdit={activeTab === 'created' || selectedWorkflow.createdBy === currentUser?.id}
        />
      )}
      
      {/* Workflow Edit Modal - Using your existing modal with required props */}
      {showEditModal && selectedWorkflow && (
        <WorkflowEditModal
          workflow={selectedWorkflow}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleWorkflowUpdate}
          onDelete={handleWorkflowDeleted}
          currentUser={currentUser}
          users={users} // Pass the users array from state
          canDelete={canDeleteWorkflow(selectedWorkflow)}
        />
      )}
    </div>
  );
};

export default MyWorkflows;
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkflowService from '../services/WorkflowService';
import UserService from '../services/UserService';
import AuthService from '../services/authService';
import WorkflowDetailModal from './WorkflowDetailModal';
import WorkflowEditModal from './WorkflowEditModal';
import './page styles/AllWorkflows.css';

const AllWorkflows = () => {
  const [workflows, setWorkflows] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [assigneeRoleFilter, setAssigneeRoleFilter] = useState('');
  const [creatorFilter, setCreatorFilter] = useState('');
  
  // Modal state
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const navigate = useNavigate();

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
      
      // Build query parameters based on filters
      let queryParams = new URLSearchParams();
      if (statusFilter) queryParams.append('status', statusFilter);
      if (assigneeFilter) queryParams.append('assigneeId', assigneeFilter);
      if (assigneeRoleFilter) queryParams.append('assignedToRole', assigneeRoleFilter);
      // Note: creatorFilter is not directly supported by the backend API as seen in the controller
      
      let result = [];
      
      // Fetch workflows based on user role and filters
      switch(user.role) {
        case 'ADMIN':
          // Admins see all workflows with optional filters
          result = await WorkflowService.getAllWorkflows(queryParams);
          break;
        case 'MANAGER':
          // Managers see workflows based on role filters or their own
          result = await WorkflowService.getAllWorkflows(queryParams);
          break;
        case 'STAFF':
          // Staff can only see their assigned workflows
          if (Object.keys(queryParams).length > 0) {
            // If filters are applied, use them
            result = await WorkflowService.getMyAssignedWorkflows(queryParams);
          } else {
            // Otherwise just get all their assigned workflows
            result = await WorkflowService.getMyAssignedWorkflows();
          }
          break;
        default:
          result = [];
      }
      
      // If we have a creatorFilter but the backend doesn't support it directly, filter locally
      if (creatorFilter && result.length > 0) {
        result = result.filter(workflow => workflow.createdBy === creatorFilter);
      }
      
      setWorkflows(Array.isArray(result) ? result : []);
      // Reset to first page when filtering changes
      setCurrentPage(1);
    } catch (err) {
      console.error('Error fetching workflows:', err);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError('Session expired. Please log in again.');
        AuthService.logout();
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('Failed to load workflows. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, statusFilter, assigneeFilter, assigneeRoleFilter, creatorFilter]);

  // Fetch users function
  const fetchUsers = useCallback(async () => {
    try {
      const user = AuthService.getCurrentUser();
      if (!user) {
        navigate('/login');
        return;
      }
      
      let fetchedUsers = [];
      if (user.role === 'ADMIN') {
        fetchedUsers = await UserService.getAllUsers();
      } else if (user.role === 'MANAGER') {
        const managers = await UserService.getUsersByRole('MANAGER');
        const staff = await UserService.getUsersByRole('STAFF');
        fetchedUsers = [...managers, ...staff];
      } else {
        fetchedUsers = await UserService.getUsersByRole('STAFF');
      }
      
      setUsers(fetchedUsers);
      setCurrentUser(user);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }, [navigate]);

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      const user = AuthService.getCurrentUser();
      if (!user) {
        navigate('/login');
        return;
      }
      
      await fetchUsers();
      await fetchWorkflows();
    };
    
    loadInitialData();
  }, [navigate, fetchUsers, fetchWorkflows]);

  // Handle status filter change
  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
  };

  // Handle assignee filter change
  const handleAssigneeChange = (e) => {
    setAssigneeFilter(e.target.value);
  };

  // Handle assignee role filter change
  const handleAssigneeRoleChange = (e) => {
    setAssigneeRoleFilter(e.target.value);
    setAssigneeFilter(''); // Reset assignee filter when role changes
  };

  // Handle creator filter change
  const handleCreatorFilterChange = (e) => {
    setCreatorFilter(e.target.value);
  };

  // Handle search term change (local filter)
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Get filtered users by role for assignee dropdown
  const getFilteredUsers = () => {
    if (!assigneeRoleFilter) return users;
    return users.filter(user => user.role === assigneeRoleFilter);
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
    setWorkflows(workflows.filter(w => w.id !== workflowId));
    setShowEditModal(false);
  };

  // Navigate to workflow creation page
  const handleCreateWorkflow = () => {
    navigate('/workflows/create');
  };

  // Handle workflow update from edit modal
  const handleWorkflowUpdate = (updatedWorkflow) => {
    setWorkflows(workflows.map(wf => 
      wf.id === updatedWorkflow.id ? updatedWorkflow : wf
    ));
    setShowEditModal(false);
  };

  // Refresh data
  const handleRefresh = () => {
    fetchWorkflows();
  };

  // Apply filters
  const handleApplyFilters = () => {
    fetchWorkflows();
  };

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter('');
    setAssigneeFilter('');
    setAssigneeRoleFilter('');
    setCreatorFilter('');
    setSearchTerm('');
    
    // Re-fetch workflows without filters
    setTimeout(() => fetchWorkflows(), 0);
  };

  // Local filtering for search term only
  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = searchTerm === '' || 
      (workflow.title && workflow.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (workflow.description && workflow.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
    return matchesSearch;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredWorkflows.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredWorkflows.length / itemsPerPage);

  // Page change handler
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Check if current user can edit a workflow
  const canEditWorkflow = (workflow) => {
    if (!currentUser) return false;
    
    // Admins can edit any workflow
    if (currentUser.role === 'ADMIN') return true;
    
    // Creators can edit their workflows
    if (workflow.createdBy === currentUser.id) return true;
    
    // Assignees can update status
    if (workflow.assignedTo === currentUser.id) return true;
    
    return false;
  };

  // Check if current user can delete a workflow (only admins and creators)
  const canDeleteWorkflow = (workflow) => {
    if (!currentUser || !workflow) return false;
    return currentUser.role === 'ADMIN' || workflow.createdBy === currentUser.id;
  };

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Get unique roles from users for role filter
  const getAvailableRoles = () => {
    const roles = new Set(users.map(user => user.role));
    return Array.from(roles);
  };

  // Handle row click for viewing workflow
  const handleRowClick = (workflow) => {
    handleViewWorkflow(workflow);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPageButtons = 5; // Show max 5 page buttons at a time
    
    if (totalPages <= maxPageButtons) {
      // Show all pages if we have less than maxPageButtons
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show a range of pages centered around current page when possible
      let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
      let endPage = startPage + maxPageButtons - 1;
      
      if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxPageButtons + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }
    
    return pageNumbers;
  };

  if (loading && workflows.length === 0) {
    return <div className="loading">Loading workflows...</div>;
  }

  return (
    <div className="all-workflows-container">
      <div className="workflows-header">
        <h2>All Workflows</h2>
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
            <select value={statusFilter} onChange={handleStatusChange}>
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          
          <div className="assignee-role-filter">
            <label>Assigned Role:</label>
            <select value={assigneeRoleFilter} onChange={handleAssigneeRoleChange}>
              <option value="">All Roles</option>
              {getAvailableRoles().map(role => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          
          <div className="assignee-filter">
            <label>Assigned To:</label>
            <select value={assigneeFilter} onChange={handleAssigneeChange}>
              <option value="">All Assignees</option>
              {getFilteredUsers().map(user => (
                <option key={user.id} value={user.email || user.username}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
          </div>
          
          <div className="creator-filter">
            <label>Created By:</label>
            <select value={creatorFilter} onChange={handleCreatorFilterChange}>
              <option value="">All Creators</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
          </div>
          
          <button className="apply-filters-btn" onClick={handleApplyFilters}>
            Apply Filters
          </button>
          
          <button className="clear-filters-btn" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>
      
      {filteredWorkflows.length === 0 ? (
        <div className="no-workflows">
          No workflows found matching the criteria
        </div>
      ) : (
        <>
          <div className="pagination-controls top">
            <div className="items-per-page">
              <label>Items per page:</label>
              <select value={itemsPerPage} onChange={handleItemsPerPageChange}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="pagination-info">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredWorkflows.length)} of {filteredWorkflows.length} workflows
            </div>
          </div>
          
          <div className="workflows-table-container">
            <table className="workflows-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Assigned Role</th>
                  <th>Created By</th>
                  <th>Created Date</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map(workflow => (
                  <tr 
                    key={workflow.id} 
                    onClick={() => handleRowClick(workflow)}
                    className="workflow-row"
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{workflow.title}</td>
                    <td>
                      <span className={`status-badge ${workflow.status ? workflow.status.toLowerCase() : 'unknown'}`}>
                        {workflow.status || 'Unknown'}
                      </span>
                    </td>
                    <td>{workflow.assignedToName || workflow.assignedTo}</td>
                    <td>{workflow.assignedToRole || 'N/A'}</td>
                    <td>{workflow.createdByName || workflow.createdBy}</td>
                    <td>{formatDate(workflow.createdAt)}</td>
                    <td>{formatDate(workflow.dueDate)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {canEditWorkflow(workflow) && (
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
          
          <div className="pagination-controls bottom">
            <div className="pagination">
              <button 
                className="pagination-btn first" 
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              >
                &laquo;
              </button>
              <button 
                className="pagination-btn prev" 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                &lsaquo;
              </button>
              
              {getPageNumbers().map(number => (
                <button
                  key={number}
                  className={`pagination-btn ${currentPage === number ? 'active' : ''}`}
                  onClick={() => handlePageChange(number)}
                >
                  {number}
                </button>
              ))}
              
              <button 
                className="pagination-btn next" 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                &rsaquo;
              </button>
              <button 
                className="pagination-btn last" 
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                &raquo;
              </button>
            </div>
            
            <div className="pagination-info">
              Page {totalPages > 0 ? currentPage : 0} of {totalPages}
            </div>
          </div>
        </>
      )}
      
      {/* Workflow Detail Modal */}
      {showDetailModal && selectedWorkflow && (
        <WorkflowDetailModal
          workflow={selectedWorkflow}
          onClose={() => setShowDetailModal(false)}
          onEdit={() => {
            setShowDetailModal(false);
            setShowEditModal(true);
          }}
          canEdit={canEditWorkflow(selectedWorkflow)}
        />
      )}
      
      {/* Workflow Edit Modal */}
      {showEditModal && selectedWorkflow && (
        <WorkflowEditModal
          workflow={selectedWorkflow}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleWorkflowUpdate}
          onDelete={handleWorkflowDeleted}
          currentUser={currentUser}
          users={users}
          canDelete={canDeleteWorkflow(selectedWorkflow)}
        />
      )}
    </div>
  );
};

export default AllWorkflows;
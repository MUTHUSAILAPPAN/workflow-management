import axios from 'axios';
import authService from './authService';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Enhanced request interceptor with logging
api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    console.debug(`[Request Interceptor] Preparing ${config.method.toUpperCase()} request to ${config.url}`);
    
    if (!token) {
      console.error('[Auth Error] No token available - redirecting to login');
      authService.logout();
      return Promise.reject(new Error('Authentication token missing'));
    }

    console.debug('[Request Interceptor] Adding authorization token');
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    console.error('[Request Interceptor Error]', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with logging - Modified to NOT auto-logout on 403 errors
api.interceptors.response.use(
  (response) => {
    console.debug(`[Response Interceptor] Received response from ${response.config.url}`, {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('[Response Interceptor Error]', {
      config: error.config,
      response: error.response,
      message: error.message
    });
    
    if (error.response) {
      console.error(`[API Error] Status: ${error.response.status}`, error.response.data);
      
      // Only auto-logout on 401 (Unauthorized), not on 403 (Forbidden)
      if (error.response.status === 401) {
        console.warn('[Auth Error] Session expired - logging out');
        authService.logout();
      }
      // For 403, just log a warning but don't logout
      else if (error.response.status === 403) {
        console.warn('[Auth Error] Permission denied for this action');
      }
    } else if (error.request) {
      console.error('[Network Error] No response received:', error.request);
    } else {
      console.error('[Request Error] Setup failed:', error.message);
    }
    
    return Promise.reject(error);
  }
);

class WorkflowService {
  /**
   * Get all workflows with optional filters
   * @param {Object|URLSearchParams} filters - Filter criteria
   * @returns {Promise<Array>} Array of workflows
   */
  async getAllWorkflows(filters = {}) {
    try {
      console.debug('[WorkflowService] Fetching workflows with filters:', filters);
      
      // Handle both object and URLSearchParams
      let params = {};
      
      // Convert URLSearchParams to object if needed
      if (filters instanceof URLSearchParams) {
        // Log the exact parameters being sent
        console.debug('[WorkflowService] URLSearchParams entries:', 
          Array.from(filters.entries()));
          
        for (const [key, value] of filters.entries()) {
          params[key] = value;
        }
      } else {
        params = {
          status: filters.status || undefined,
          assigneeId: filters.assigneeId || undefined,
          assignedToRole: filters.assignedToRole || undefined,
          createdBy: filters.createdBy || undefined
        };
      }

      // Clean up undefined values
      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === '') {
          delete params[key];
        }
      });

      console.debug('[WorkflowService] Final request params:', params);
      const response = await api.get('/workflows', { params });
      
      console.debug('[WorkflowService] Successfully fetched workflows:', {
        count: response.data.length,
        sample: response.data.length > 0 ? response.data[0] : null
      });
      
      return response.data;
    } catch (error) {
      console.error('[WorkflowService] Failed to fetch workflows:', {
        error: error.message,
        filters
      });
      throw error;
    }
  }

  /**
   * Get workflow by ID
   * @param {string} id - Workflow ID
   * @returns {Promise<Object>} Workflow details
   */
  async getWorkflowById(id) {
    try {
      console.debug(`[WorkflowService] Fetching workflow with ID: ${id}`);
      const response = await api.get(`/workflows/${id}`);
      
      console.debug('[WorkflowService] Successfully fetched workflow:', response.data);
      return response.data;
    } catch (error) {
      console.error(`[WorkflowService] Error fetching workflow ${id}:`, {
        error: error.message,
        status: error.response?.status
      });
      throw error;
    }
  }

  /**
   * Create new workflow
   * @param {Object} workflowData - Workflow creation data
   * @returns {Promise<Object>} Created workflow
   */
  async createWorkflow(workflowData) {
    try {
      console.debug('[WorkflowService] Creating workflow with data:', workflowData);
      const response = await api.post('/workflows', workflowData);
      
      console.debug('[WorkflowService] Workflow created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('[WorkflowService] Error creating workflow:', {
        error: error.message,
        data: workflowData
      });
      throw error;
    }
  }

  /**
   * Update existing workflow
   * @param {string} id - Workflow ID
   * @param {Object} workflowData - Update data
   * @returns {Promise<Object>} Updated workflow
   */
  async updateWorkflow(id, workflowData) {
    try {
      console.debug(`[WorkflowService] Updating workflow ${id} with data:`, workflowData);
      
      // Make a copy to avoid modifying the original data
      const workflowToUpdate = { ...workflowData };
      
      // Ensure assignedTo contains the ID/email, not the name
      if (workflowToUpdate.assignedTo) {
        // assignedTo should already be the ID/email in our updated code,
        // but adding this check for safety
        console.debug(`[WorkflowService] Using assignedTo ID: ${workflowToUpdate.assignedTo}`);
      }
      
      const response = await api.put(`/workflows/${id}`, workflowToUpdate);
      
      console.debug('[WorkflowService] Workflow updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error(`[WorkflowService] Error updating workflow ${id}:`, {
        error: error.message,
        data: workflowData
      });
      throw error;
    }
  }

  /**
   * Delete workflow
   * @param {string} id - Workflow ID
   * @returns {Promise<void>}
   */
  async deleteWorkflow(id) {
    try {
      console.debug(`[WorkflowService] Deleting workflow with ID: ${id}`);
      await api.delete(`/workflows/${id}`);
      
      console.debug(`[WorkflowService] Workflow ${id} deleted successfully`);
    } catch (error) {
      console.error(`[WorkflowService] Error deleting workflow ${id}:`, {
        error: error.message,
        status: error.response?.status
      });
      throw error;
    }
  }

  /**
   * Get workflows assigned to current user
   * @param {Object|URLSearchParams} filters - Optional filters
   * @returns {Promise<Array>} Array of assigned workflows
   */
  async getMyAssignedWorkflows(filters = {}) {
    try {
      console.debug('[WorkflowService] Fetching workflows assigned to current user with filters:', filters);
      
      // Handle filters if provided
      let params = {};
      
      // Convert URLSearchParams to object if needed
      if (filters instanceof URLSearchParams) {
        console.debug('[WorkflowService] My assigned workflows - URLSearchParams entries:', 
          Array.from(filters.entries()));
          
        for (const [key, value] of filters.entries()) {
          params[key] = value;
        }
      } else if (Object.keys(filters).length > 0) {
        params = { ...filters };
      }
      
      console.debug('[WorkflowService] My assigned workflows - Final params:', params);
      
      // Use special endpoint when no filters, otherwise use main endpoint with assigneeId=current
      let response;
      if (Object.keys(params).length === 0) {
        response = await api.get('/workflows/me/assigned');
      } else {
        // For filtered requests, use the filtered endpoint with query params
        response = await api.get('/workflows/me/assigned', { params });
      }
      
      console.debug('[WorkflowService] Successfully fetched assigned workflows:', {
        count: response.data.length,
        sample: response.data.length > 0 ? response.data[0] : null
      });
      
      return response.data;
    } catch (error) {
      console.error('[WorkflowService] Error fetching assigned workflows:', error.message);
      throw error;
    }
  }

  /**
   * Get workflows created by current user
   * @param {Object|URLSearchParams} filters - Optional filters
   * @returns {Promise<Array>} Array of created workflows
   */
  async getMyCreatedWorkflows(filters = {}) {
    try {
      console.debug('[WorkflowService] Fetching workflows created by current user with filters:', filters);
      
      // Handle filters if provided
      let params = {};
      
      // Convert URLSearchParams to object if needed
      if (filters instanceof URLSearchParams) {
        console.debug('[WorkflowService] My created workflows - URLSearchParams entries:', 
          Array.from(filters.entries()));
          
        for (const [key, value] of filters.entries()) {
          params[key] = value;
        }
      } else if (Object.keys(filters).length > 0) {
        params = { ...filters };
      }
      
      console.debug('[WorkflowService] My created workflows - Final params:', params);
      
      // Use special endpoint when no filters, otherwise use main endpoint with createdBy=current
      let response;
      if (Object.keys(params).length === 0) {
        response = await api.get('/workflows/me/created');
      } else {
        // For filtered requests, use the filtered endpoint with query params
        response = await api.get('/workflows/me/created', { params });
      }
      
      console.debug('[WorkflowService] Successfully fetched created workflows:', {
        count: response.data.length,
        sample: response.data.length > 0 ? response.data[0] : null
      });
      
      return response.data;
    } catch (error) {
      console.error('[WorkflowService] Error fetching created workflows:', error.message);
      throw error;
    }
  }

  /**
   * Update workflow status - DEPRECATED, use updateWorkflow instead
   * @param {string} id - Workflow ID
   * @param {string} newStatus - New status value
   * @returns {Promise<Object>} Updated workflow
   */
  async updateWorkflowStatus(id, newStatus) {
    try {
      console.debug(`[WorkflowService] Updating workflow ${id} status to: ${newStatus}`);
      // Use updateWorkflow instead of a separate status endpoint
      const workflow = await this.getWorkflowById(id);
      workflow.status = newStatus;
      
      return await this.updateWorkflow(id, { status: newStatus });
    } catch (error) {
      console.error(`[WorkflowService] Error updating status for workflow ${id}:`, {
        error: error.message,
        newStatus
      });
      throw error;
    }
  }

  /**
   * Get workflows by status
   * @param {string} status - Status filter
   * @returns {Promise<Array>} Array of filtered workflows
   */
  async getWorkflowsByStatus(status) {
    try {
      console.debug(`[WorkflowService] Fetching workflows with status: ${status}`);
      return await this.getAllWorkflows({ status: status.toUpperCase() });
    } catch (error) {
      console.error(`[WorkflowService] Error fetching ${status} workflows:`, error.message);
      throw error;
    }
  }

  /**
   * Get workflows by assignee
   * @param {string} assigneeId - Assignee ID
   * @returns {Promise<Array>} Array of filtered workflows
   */
  async getWorkflowsByAssignee(assigneeId) {
    try {
      console.debug(`[WorkflowService] Fetching workflows for assignee: ${assigneeId}`);
      return await this.getAllWorkflows({ assigneeId });
    } catch (error) {
      console.error(`[WorkflowService] Error fetching workflows for assignee ${assigneeId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get workflows by creator
   * @param {string} creatorId - Creator ID
   * @returns {Promise<Array>} Array of filtered workflows
   */
  async getWorkflowsByCreator(creatorId) {
    try {
      console.debug(`[WorkflowService] Fetching workflows created by: ${creatorId}`);
      return await this.getAllWorkflows({ createdBy: creatorId });
    } catch (error) {
      console.error(`[WorkflowService] Error fetching workflows by creator ${creatorId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get workflows by assigned role
   * @param {string} role - Role filter
   * @returns {Promise<Array>} Array of filtered workflows
   */
  async getWorkflowsByAssignedRole(role) {
    try {
      console.debug(`[WorkflowService] Fetching workflows with assigned role: ${role}`);
      return await this.getAllWorkflows({ assignedToRole: role.toUpperCase() });
    } catch (error) {
      console.error(`[WorkflowService] Error fetching ${role} workflows:`, error.message);
      throw error;
    }
  }
}

export default new WorkflowService();
import React from 'react';
import './page styles/WorkflowModal.css';

const WorkflowDetailModal = ({ workflow, onClose, onEdit, canEdit }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusClass = (status) => {
    if (!status) return 'unknown';
    return status.toLowerCase();
  };

  return (
    <div className="workflow-modal-overlay">
      <div className="workflow-modal-card">
        <div className="modal-header">
          <h2>Workflow Details</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          <div className="detail-section">
            <h3 className="workflow-title">{workflow.title}</h3>
            
            <div className="status-section">
              <span className={`status-badge ${getStatusClass(workflow.status)}`}>
                {workflow.status || 'Unknown'}
              </span>
            </div>
            
            <div className="description-section">
              <h4>Description</h4>
              <p className="workflow-description">{workflow.description}</p>
            </div>
            
            <div className="assignments">
              <div className="detail-row">
                <span className="detail-label">Assigned To:</span>
                <span className="detail-value">{workflow.assignedTo}</span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Role:</span>
                <span className="detail-value">{workflow.assignedToRole || 'N/A'}</span>
              </div>
            </div>
            
            <div className="dates">
              <div className="detail-row">
                <span className="detail-label">Created By:</span>
                <span className="detail-value">{workflow.createdBy}</span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Created Date:</span>
                <span className="detail-value">{formatDate(workflow.createdAt)}</span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Due Date:</span>
                <span className="detail-value">{formatDate(workflow.dueDate)}</span>
              </div>
              
              {workflow.completedAt && (
                <div className="detail-row">
                  <span className="detail-label">Completed Date:</span>
                  <span className="detail-value">{formatDate(workflow.completedAt)}</span>
                </div>
              )}
            </div>
            
            {workflow.comments && workflow.comments.length > 0 && (
              <div className="comments-section">
                <h4>Comments</h4>
                <ul className="comments-list">
                  {workflow.comments.map((comment, index) => (
                    <li key={index} className="comment-item">
                      <div className="comment-header">
                        <span className="comment-author">{comment.author}</span>
                        <span className="comment-date">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="comment-text">{comment.text}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>Close</button>
          {canEdit && (
            <button className="primary-btn" onClick={onEdit}>Edit</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowDetailModal;
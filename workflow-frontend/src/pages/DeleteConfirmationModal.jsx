import React from 'react';
import './page styles/WorkflowModal.css';

const DeleteConfirmationModal = ({ title, onCancel, onConfirm, entityType = 'workflow' }) => {
  return (
    <div className="delete-modal-overlay">
      <div className="delete-confirmation-modal">
        <h3>Confirm Delete</h3>
        <p>Are you sure you want to delete the {entityType} "{title}"?</p>
        <p>This action cannot be undone.</p>
        <div className="delete-modal-actions">
          <button 
            className="cancel-btn"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            className="delete-confirm-btn"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
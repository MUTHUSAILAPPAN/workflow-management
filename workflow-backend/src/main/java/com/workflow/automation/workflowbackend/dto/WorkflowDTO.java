package com.workflow.automation.workflowbackend.dto;

import com.workflow.automation.workflowbackend.model.User;
import com.workflow.automation.workflowbackend.model.UserRole;
import com.workflow.automation.workflowbackend.model.Workflow;
import java.time.Instant;

public class WorkflowDTO {
    private String id;
    private String title;
    private String description;
    private String status;
    private String createdBy;
    private String assignedTo;
    private UserRole assignedToRole;
    private Instant createdAt;
    private Instant updatedAt;
    private String dueDate;

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(String assignedTo) {
        this.assignedTo = assignedTo;
    }

    public UserRole getAssignedToRole() {
        return assignedToRole;
    }

    public void setAssignedToRole(UserRole assignedToRole) {
        this.assignedToRole = assignedToRole;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getDueDate() {
        return dueDate;
    }

    public void setDueDate(String dueDate) {
        this.dueDate = dueDate;
    }

    public static WorkflowDTO fromWorkflow(Workflow workflow) {
        WorkflowDTO dto = new WorkflowDTO();
        dto.setId(workflow.getId());
        dto.setTitle(workflow.getTitle());
        dto.setDescription(workflow.getDescription());
        dto.setStatus(workflow.getStatus().name());
        dto.setCreatedBy(workflow.getCreatedBy());
        dto.setAssignedTo(workflow.getAssignedTo());
        dto.setAssignedToRole(workflow.getAssignedToRole());
        dto.setCreatedAt(workflow.getCreatedAt());
        dto.setUpdatedAt(workflow.getUpdatedAt());
        dto.setDueDate(workflow.getDueDate() != null ? workflow.getDueDate().toString() : null);
        return dto;
    }
}
package com.workflow.automation.workflowbackend.repository;

import com.workflow.automation.workflowbackend.model.Workflow;
import com.workflow.automation.workflowbackend.model.UserRole;
import com.workflow.automation.workflowbackend.model.WorkflowStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface WorkflowRepository extends MongoRepository<Workflow, String> {
    List<Workflow> findAll();
    List<Workflow> findByAssignedToRole(UserRole role);
    List<Workflow> findByAssignedToRoleIn(List<UserRole> roles);
    List<Workflow> findByCreatedBy(String createdBy);
    List<Workflow> findByAssignedTo(String assignedTo);



    List<Workflow> findByStatus(WorkflowStatus workflowStatus);

    List<Workflow> findByStatusAndAssignedTo(WorkflowStatus workflowStatus, String assignedTo);

    List<Workflow> findByStatusAndAssignedToRoleIn(WorkflowStatus workflowStatus, List<UserRole> list);

    List<Workflow> findByStatusAndAssignedToRole(WorkflowStatus workflowStatus, UserRole userRole);

    List<Workflow> findByAssignedToAndAssignedToRoleIn(String assigneeId, List<UserRole> list);
    List<Workflow> findByStatusAndAssignedToAndAssignedToRoleIn(
            WorkflowStatus status, String assigneeId, List<UserRole> roles);
}
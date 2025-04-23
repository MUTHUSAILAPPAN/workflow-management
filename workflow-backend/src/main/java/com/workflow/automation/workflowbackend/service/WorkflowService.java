package com.workflow.automation.workflowbackend.service;

import com.workflow.automation.workflowbackend.exception.AccessDeniedException;
import com.workflow.automation.workflowbackend.exception.ResourceNotFoundException;
import com.workflow.automation.workflowbackend.model.User;
import com.workflow.automation.workflowbackend.model.UserRole;
import com.workflow.automation.workflowbackend.model.Workflow;
import com.workflow.automation.workflowbackend.model.WorkflowStatus;
import com.workflow.automation.workflowbackend.repository.UserRepository;
import com.workflow.automation.workflowbackend.repository.WorkflowRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class WorkflowService {

    private final WorkflowRepository workflowRepository;
    private final UserRepository userRepository;

    @Autowired
    public WorkflowService(WorkflowRepository workflowRepository, UserRepository userRepository) {
        this.workflowRepository = workflowRepository;
        this.userRepository = userRepository;
    }

    public Workflow createWorkflow(Workflow workflow, UserDetails currentUser) {
        validateAssignee(workflow.getAssignedTo(), workflow.getAssignedToRole());

        workflow.setCreatedBy(currentUser.getUsername());
        workflow.setCreatedAt(Instant.now());
        workflow.setUpdatedAt(Instant.now());
        workflow.setStatus(WorkflowStatus.PENDING);
        return workflowRepository.save(workflow);
    }

    public List<Workflow> getAllWorkflows(UserDetails currentUser, String status, String assigneeId, String assignedToRole) {
        if (hasAuthority(currentUser, "ADMIN")) {
            return getAllWorkflowsForAdmin(status, assigneeId, assignedToRole);
        } else if (hasAuthority(currentUser, "MANAGER")) {
            return getAllWorkflowsForManager(status, assigneeId, assignedToRole);
        } else {
            return getAllWorkflowsForStaff(status, currentUser);
        }
    }

    private List<Workflow> getAllWorkflowsForAdmin(String status, String assigneeId, String assignedToRole) {
        if (status != null && assigneeId != null) {
            return workflowRepository.findByStatusAndAssignedTo(
                    WorkflowStatus.valueOf(status.toUpperCase()),
                    assigneeId
            );
        } else if (status != null) {
            return workflowRepository.findByStatus(
                    WorkflowStatus.valueOf(status.toUpperCase())
            );
        } else if (assigneeId != null) {
            return workflowRepository.findByAssignedTo(assigneeId);
        } else if (assignedToRole != null) {
            return workflowRepository.findByAssignedToRole(
                    UserRole.valueOf(assignedToRole.toUpperCase())
            );
        }
        return workflowRepository.findAll();
    }

    private List<Workflow> getAllWorkflowsForManager(String status, String assigneeId, String assignedToRole) {
        List<UserRole> allowedRoles = Arrays.asList(UserRole.MANAGER, UserRole.STAFF);

        if (status != null && assigneeId != null) {
            return workflowRepository.findByStatusAndAssignedToAndAssignedToRoleIn(
                    WorkflowStatus.valueOf(status.toUpperCase()),
                    assigneeId,
                    allowedRoles
            );
        } else if (status != null) {
            return workflowRepository.findByStatusAndAssignedToRoleIn(
                    WorkflowStatus.valueOf(status.toUpperCase()),
                    allowedRoles
            );
        } else if (assigneeId != null) {
            return workflowRepository.findByAssignedToAndAssignedToRoleIn(
                    assigneeId,
                    allowedRoles
            );
        } else if (assignedToRole != null) {
            UserRole role = UserRole.valueOf(assignedToRole.toUpperCase());
            if (!allowedRoles.contains(role)) {
                return Collections.emptyList();
            }
            return workflowRepository.findByAssignedToRole(role);
        }
        return workflowRepository.findByAssignedToRoleIn(allowedRoles);
    }

    private List<Workflow> getAllWorkflowsForStaff(String status, UserDetails currentUser) {
        if (status != null) {
            return workflowRepository.findByStatusAndAssignedTo(
                    WorkflowStatus.valueOf(status.toUpperCase()),
                    currentUser.getUsername()
            );
        }
        return workflowRepository.findByAssignedTo(currentUser.getUsername());
    }

    public Workflow getWorkflowById(String id, UserDetails currentUser) throws AccessDeniedException {
        Workflow workflow = workflowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found with id: " + id));

        validateWorkflowAccess(workflow, currentUser);
        return workflow;
    }

    public Workflow updateWorkflow(String id, Workflow workflowDetails, UserDetails currentUser) throws AccessDeniedException {
        Workflow workflow = workflowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found with id: " + id));

        validateWorkflowAccess(workflow, currentUser);

        if (!canEditWorkflow(workflow, currentUser)) {
            throw new AccessDeniedException("Not authorized to edit this workflow");
        }

        updateWorkflowFields(workflow, workflowDetails, currentUser);
        workflow.setUpdatedAt(Instant.now());
        return workflowRepository.save(workflow);
    }

    public void deleteWorkflow(String id, UserDetails currentUser) throws AccessDeniedException {
        Workflow workflow = workflowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found with id: " + id));

        if (!workflow.getCreatedBy().equals(currentUser.getUsername()) && !hasAuthority(currentUser, "ADMIN")) {
            throw new AccessDeniedException("Only admins or workflow creators can delete workflows");
        }

        workflowRepository.delete(workflow);
    }

    public List<Workflow> getWorkflowsByAssignee(String assigneeId, UserDetails currentUser) throws AccessDeniedException {
        if (hasAuthority(currentUser, "ADMIN")) {
            return workflowRepository.findByAssignedTo(assigneeId);
        } else if (hasAuthority(currentUser, "MANAGER")) {
            List<Workflow> workflows = workflowRepository.findByAssignedTo(assigneeId);
            return workflows.stream()
                    .filter(w -> w.getAssignedToRole() == UserRole.MANAGER ||
                            w.getAssignedToRole() == UserRole.STAFF)
                    .collect(Collectors.toList());
        } else {
            if (!assigneeId.equals(currentUser.getUsername())) {
                throw new AccessDeniedException("You can only view your own assigned workflows");
            }
            return workflowRepository.findByAssignedTo(assigneeId);
        }
    }

    public List<Workflow> getWorkflowsByCreator(String creatorId, UserDetails currentUser) {
        return workflowRepository.findByCreatedBy(creatorId);
    }

    public Workflow updateWorkflowStatus(String id, String newStatus, UserDetails currentUser) throws AccessDeniedException {
        Workflow workflow = workflowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found with id: " + id));

        if (!workflow.getAssignedTo().equals(currentUser.getUsername())) {
            throw new AccessDeniedException("Only the assignee can update workflow status");
        }

        workflow.setStatus(WorkflowStatus.valueOf(newStatus.toUpperCase()));
        workflow.setUpdatedAt(Instant.now());
        return workflowRepository.save(workflow);
    }

    // Helper methods
    private boolean hasAuthority(UserDetails user, String authority) {
        return user.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + authority));
    }

    private boolean hasAccessToWorkflow(Workflow workflow, UserDetails currentUser) {
        if (hasAuthority(currentUser, "ADMIN")) return true;
        if (workflow.getAssignedTo().equals(currentUser.getUsername())) return true;
        if (workflow.getCreatedBy().equals(currentUser.getUsername())) return true;
        return false;
    }

    private boolean canEditWorkflow(Workflow workflow, UserDetails currentUser) {
        if (hasAuthority(currentUser, "ADMIN")) return true;
        if (workflow.getCreatedBy().equals(currentUser.getUsername())) return true;
        if (workflow.getAssignedTo().equals(currentUser.getUsername())) return true;
        return false;
    }

    private void updateWorkflowFields(Workflow workflow, Workflow workflowDetails, UserDetails currentUser) {
        workflow.setTitle(workflowDetails.getTitle());
        workflow.setDescription(workflowDetails.getDescription());

        if (workflow.getAssignedTo().equals(currentUser.getUsername())) {
            workflow.setStatus(workflowDetails.getStatus());
        }

        if (hasAuthority(currentUser, "ADMIN") ||
                workflow.getCreatedBy().equals(currentUser.getUsername())) {
            workflow.setAssignedTo(workflowDetails.getAssignedTo());
            workflow.setAssignedToRole(workflowDetails.getAssignedToRole());
        }
    }

    public void validateAssignee(String assigneeId, UserRole assignedRole) {
        Optional<User> assignee = userRepository.findByEmail(assigneeId);
        if (assignee.isEmpty()) {
            throw new ResourceNotFoundException("Assignee not found with id: " + assigneeId);
        }
        if (assignee.get().getRole() != assignedRole) {
            throw new IllegalArgumentException("Assignee role doesn't match the required role");
        }
    }

    private void validateWorkflowAccess(Workflow workflow, UserDetails currentUser) throws AccessDeniedException {
        if (!hasAccessToWorkflow(workflow, currentUser)) {
            throw new AccessDeniedException("Not authorized to access this workflow");
        }
    }

    public List<Workflow> getWorkflowsByAssignedToRole(String role, UserDetails currentUser) throws AccessDeniedException {
        UserRole userRole = UserRole.valueOf(role.toUpperCase());

        if (hasAuthority(currentUser, "ADMIN")) {
            return workflowRepository.findByAssignedToRole(userRole);
        } else if (hasAuthority(currentUser, "MANAGER")) {
            if (userRole != UserRole.MANAGER && userRole != UserRole.STAFF) {
                throw new AccessDeniedException("You can only filter by MANAGER or STAFF roles");
            }
            return workflowRepository.findByAssignedToRole(userRole);
        } else {
            if (userRole != UserRole.STAFF) {
                throw new AccessDeniedException("You can only view STAFF workflows");
            }
            return workflowRepository.findByAssignedToRole(userRole);
        }
    }
}
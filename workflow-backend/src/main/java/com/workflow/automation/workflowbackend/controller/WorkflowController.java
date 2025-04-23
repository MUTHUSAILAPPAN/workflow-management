package com.workflow.automation.workflowbackend.controller;

import com.workflow.automation.workflowbackend.dto.WorkflowDTO;
import com.workflow.automation.workflowbackend.model.Workflow;
import com.workflow.automation.workflowbackend.service.WorkflowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/workflows")
public class WorkflowController {

    @Autowired
    private WorkflowService workflowService;

    @PostMapping
    public ResponseEntity<WorkflowDTO> createWorkflow(
            @RequestBody Workflow workflow,
            @AuthenticationPrincipal UserDetails currentUser) {
        // Validate assignee exists and has the correct role
        workflowService.validateAssignee(workflow.getAssignedTo(), workflow.getAssignedToRole());

        Workflow createdWorkflow = workflowService.createWorkflow(workflow, currentUser);
        return new ResponseEntity<>(WorkflowDTO.fromWorkflow(createdWorkflow), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<WorkflowDTO>> getAllWorkflows(
            @AuthenticationPrincipal UserDetails currentUser,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String assigneeId,
            @RequestParam(required = false) String assignedToRole,
            @RequestParam(required = false) String createdBy) throws AccessDeniedException {

        List<Workflow> workflows = workflowService.getAllWorkflows(currentUser, status, assigneeId, assignedToRole);

        List<WorkflowDTO> workflowDTOs = workflows.stream()
                .map(WorkflowDTO::fromWorkflow)
                .collect(Collectors.toList());

        return ResponseEntity.ok(workflowDTOs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkflowDTO> getWorkflowById(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails currentUser) throws AccessDeniedException {
        Workflow workflow = workflowService.getWorkflowById(id, currentUser);
        return ResponseEntity.ok(WorkflowDTO.fromWorkflow(workflow));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkflowDTO> updateWorkflow(
            @PathVariable String id,
            @RequestBody Workflow workflowDetails,
            @AuthenticationPrincipal UserDetails currentUser) throws AccessDeniedException {
        Workflow updatedWorkflow = workflowService.updateWorkflow(id, workflowDetails, currentUser);
        return ResponseEntity.ok(WorkflowDTO.fromWorkflow(updatedWorkflow));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkflow(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails currentUser) throws AccessDeniedException {
        workflowService.deleteWorkflow(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me/assigned")
    public ResponseEntity<List<WorkflowDTO>> getMyAssignedWorkflows(
            @AuthenticationPrincipal UserDetails currentUser) throws AccessDeniedException {
        List<Workflow> workflows = workflowService.getWorkflowsByAssignee(currentUser.getUsername(), currentUser);
        List<WorkflowDTO> workflowDTOs = workflows.stream()
                .map(WorkflowDTO::fromWorkflow)
                .collect(Collectors.toList());
        return ResponseEntity.ok(workflowDTOs);
    }

    @GetMapping("/me/created")
    public ResponseEntity<List<WorkflowDTO>> getMyCreatedWorkflows(
            @AuthenticationPrincipal UserDetails currentUser) throws AccessDeniedException {
        List<Workflow> workflows = workflowService.getWorkflowsByCreator(currentUser.getUsername(), currentUser);
        List<WorkflowDTO> workflowDTOs = workflows.stream()
                .map(WorkflowDTO::fromWorkflow)
                .collect(Collectors.toList());
        return ResponseEntity.ok(workflowDTOs);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<WorkflowDTO> updateWorkflowStatus(
            @PathVariable String id,
            @RequestParam String newStatus,
            @AuthenticationPrincipal UserDetails currentUser) throws AccessDeniedException {
        Workflow updatedWorkflow = workflowService.updateWorkflowStatus(id, newStatus, currentUser);
        return ResponseEntity.ok(WorkflowDTO.fromWorkflow(updatedWorkflow));
    }
}
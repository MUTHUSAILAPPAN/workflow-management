package com.workflow.automation.workflowbackend.controller;

import com.workflow.automation.workflowbackend.exception.AccessDeniedException;
import com.workflow.automation.workflowbackend.model.User;
import com.workflow.automation.workflowbackend.model.UserRole;
import com.workflow.automation.workflowbackend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<User> createUser(@RequestBody User user,
                                           @AuthenticationPrincipal org.springframework.security.core.userdetails.User authUser) {
        User creator = userService.findByEmail(authUser.getUsername())
                .orElseThrow(() -> new AccessDeniedException("Invalid creator user"));

        if (creator.getRole() == UserRole.MANAGER && user.getRole() != UserRole.STAFF) {
            throw new AccessDeniedException("MANAGER can only create STAFF users");
        }

        return ResponseEntity.ok(userService.createUser(user, creator));
    }

    @PostMapping("/{userId}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> changeUserRole(
            @PathVariable String userId,
            @RequestParam UserRole newRole,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.User authUser) {
        User adminUser = userService.findByEmail(authUser.getUsername())
                .orElseThrow(() -> new AccessDeniedException("Invalid admin user"));

        if (adminUser.getId().equals(userId)) {
            throw new AccessDeniedException("ADMIN cannot change their own role");
        }

        return ResponseEntity.ok(userService.changeUserRole(userId, newRole, adminUser));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<List<User>> getUsers() {
        return ResponseEntity.ok(userService.findAll());
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<User> getUserById(@PathVariable String userId,
                                            @AuthenticationPrincipal org.springframework.security.core.userdetails.User authUser) {
        User requester = userService.findByEmail(authUser.getUsername())
                .orElseThrow(() -> new AccessDeniedException("Invalid requester"));

        User user = userService.findById(userId);

        // Allow users to view themselves regardless of role
        if (requester.getId().equals(userId)) {
            return ResponseEntity.ok(user);
        }

        if (!requester.getRole().canManage(user.getRole())) {
            throw new AccessDeniedException("Cannot view user with higher role");
        }

        return ResponseEntity.ok(user);
    }

    @PutMapping("/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<User> updateUser(
            @PathVariable String userId,
            @RequestBody User updatedUser,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.User authUser) {
        User editor = userService.findByEmail(authUser.getUsername())
                .orElseThrow(() -> new AccessDeniedException("Invalid editor"));

        User existingUser = userService.findById(userId);

        // Allow users to update themselves (except role)
        if (editor.getId().equals(userId)) {
            if (updatedUser.getRole() != null && !updatedUser.getRole().equals(existingUser.getRole())) {
                throw new AccessDeniedException("Cannot change your own role");
            }
            return ResponseEntity.ok(userService.updateUser(userId, updatedUser, editor));
        }

        // Check if editor can manage the target user
        if (!editor.getRole().canManage(existingUser.getRole())) {
            throw new AccessDeniedException("Cannot update user with higher role");
        }

        // Prevent role changes through this endpoint
        if (updatedUser.getRole() != null && !updatedUser.getRole().equals(existingUser.getRole())) {
            throw new AccessDeniedException("Role can only be changed via role change endpoint");
        }

        return ResponseEntity.ok(userService.updateUser(userId, updatedUser, editor));
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> deleteUser(
            @PathVariable String userId,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.User authUser) {
        User deleter = userService.findByEmail(authUser.getUsername())
                .orElseThrow(() -> new AccessDeniedException("Invalid deleter"));

        User targetUser = userService.findById(userId);

        // Prevent self-deletion
        if (deleter.getId().equals(userId)) {
            throw new AccessDeniedException("Cannot delete yourself");
        }

        // Check if deleter can manage the target user
        if (!deleter.getRole().canManage(targetUser.getRole())) {
            throw new AccessDeniedException("Cannot delete user with higher role");
        }

        // Additional checks for MANAGERs (can only delete STAFF)
        if (deleter.getRole() == UserRole.MANAGER && targetUser.getRole() != UserRole.STAFF) {
            throw new AccessDeniedException("MANAGER can only delete STAFF users");
        }

        userService.deleteUser(userId, deleter);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/role/{role}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<User>> getUsersByRole(@PathVariable UserRole role) {
        return ResponseEntity.ok(userService.findByRole(role));
    }
}
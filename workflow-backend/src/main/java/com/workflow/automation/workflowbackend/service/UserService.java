package com.workflow.automation.workflowbackend.service;

import com.workflow.automation.workflowbackend.exception.AccessDeniedException;
import com.workflow.automation.workflowbackend.exception.ResourceNotFoundException;
import com.workflow.automation.workflowbackend.model.User;
import com.workflow.automation.workflowbackend.model.UserRole;
import com.workflow.automation.workflowbackend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User createUser(User user, User creator) {
        if (!creator.getRole().canManage(user.getRole())) {
            throw new AccessDeniedException(
                    String.format("%s cannot create users with role %s",
                            creator.getRole(), user.getRole())
            );
        }

        user.setCreatedAt(LocalDateTime.now());
        user.setCreatedBy(creator.getId());
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public User changeUserRole(String userId, UserRole newRole, User adminUser) {
        if (adminUser.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Only ADMIN can change user roles");
        }

        User userToUpdate = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (userToUpdate.getId().equals(adminUser.getId())) {
            throw new AccessDeniedException("Cannot change your own role");
        }

        userToUpdate.setRole(newRole);
        return userRepository.save(userToUpdate);
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public List<User> getAccessibleUsers(User currentUser) {
        return switch (currentUser.getRole()) {
            case ADMIN -> userRepository.findAll();
            case MANAGER -> userRepository.findByRoleIn(List.of(UserRole.MANAGER, UserRole.STAFF));
            case STAFF -> userRepository.findByRole(UserRole.STAFF);
        };
    }

    public User updateUser(String userId, User updatedUser, User editor) {
        User existingUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Allow users to update themselves (except role)
        if (editor.getId().equals(userId)) {
            if (updatedUser.getRole() != null && !updatedUser.getRole().equals(existingUser.getRole())) {
                throw new AccessDeniedException("Cannot change your own role");
            }
            existingUser.setName(updatedUser.getName() != null ? updatedUser.getName() : existingUser.getName());
            existingUser.setEmail(updatedUser.getEmail() != null ? updatedUser.getEmail() : existingUser.getEmail());
            if (updatedUser.getPassword() != null) {
                existingUser.setPassword(passwordEncoder.encode(updatedUser.getPassword()));
            }
            return userRepository.save(existingUser);
        }

        if (!editor.getRole().canManage(existingUser.getRole())) {
            throw new AccessDeniedException("Cannot modify user with higher role");
        }

        if (updatedUser.getRole() != null && !updatedUser.getRole().equals(existingUser.getRole())) {
            throw new AccessDeniedException("Use promotion endpoint to change roles");
        }

        existingUser.setName(updatedUser.getName() != null ? updatedUser.getName() : existingUser.getName());
        existingUser.setEmail(updatedUser.getEmail() != null ? updatedUser.getEmail() : existingUser.getEmail());
        if (updatedUser.getPassword() != null) {
            existingUser.setPassword(passwordEncoder.encode(updatedUser.getPassword()));
        }

        return userRepository.save(existingUser);
    }

    public void deleteUser(String userId, User deleter) {
        User userToDelete = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (userToDelete.getId().equals(deleter.getId())) {
            throw new AccessDeniedException("Cannot delete yourself");
        }

        if (!deleter.getRole().canManage(userToDelete.getRole())) {
            throw new AccessDeniedException("Cannot delete user with higher role");
        }

        // Additional check for MANAGER (can only delete STAFF)
        if (deleter.getRole() == UserRole.MANAGER && userToDelete.getRole() != UserRole.STAFF) {
            throw new AccessDeniedException("MANAGER can only delete STAFF users");
        }

        userRepository.delete(userToDelete);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User findById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    public List<User> findByRole(UserRole role) {
        return userRepository.findByRole(role);
    }
}
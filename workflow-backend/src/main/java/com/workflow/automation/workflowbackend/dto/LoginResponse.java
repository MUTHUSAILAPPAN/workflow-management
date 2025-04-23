package com.workflow.automation.workflowbackend.dto;

import com.workflow.automation.workflowbackend.model.UserRole;

public class LoginResponse {
    private String token;
    private String userId;
    private String email;
    private String name;
    private UserRole role;

    // Constructor, getters, and setters
    public LoginResponse(String token, String userId, String email, String name, UserRole role) {
        this.token = token;
        this.userId = userId;
        this.email = email;
        this.name = name;
        this.role = role;
    }

    // Getters
    public String getToken() { return token; }
    public String getUserId() { return userId; }
    public String getEmail() { return email; }
    public String getName() { return name; }
    public UserRole getRole() { return role; }
}
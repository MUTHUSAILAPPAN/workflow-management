package com.workflow.automation.workflowbackend.model;

public enum UserRole {
    ADMIN(1),
    MANAGER(2),
    STAFF(3);

    private final int level;

    UserRole(int level) {
        this.level = level;
    }

    public int getLevel() {
        return level;
    }

    public boolean canManage(UserRole otherRole) {
        return this.level <= otherRole.getLevel();
    }

    public static UserRole fromString(String role) {
        try {
            return UserRole.valueOf(role.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role: " + role);
        }
    }
}
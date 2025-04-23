package com.workflow.automation.workflowbackend.repository;

import com.workflow.automation.workflowbackend.model.User;
import com.workflow.automation.workflowbackend.model.UserRole;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);

    List<User> findByRole(UserRole role);

    @Query("{ 'role' : { $in : ?0 } }")
    List<User> findByRoleIn(List<UserRole> roles);
}

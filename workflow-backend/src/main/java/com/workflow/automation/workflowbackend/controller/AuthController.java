package com.workflow.automation.workflowbackend.controller;

import com.workflow.automation.workflowbackend.dto.LoginRequest;
import com.workflow.automation.workflowbackend.dto.LoginResponse;
import com.workflow.automation.workflowbackend.exception.AuthenticationFailedException;
import com.workflow.automation.workflowbackend.model.User;
import com.workflow.automation.workflowbackend.repository.UserRepository;
import com.workflow.automation.workflowbackend.service.JwtService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtService jwtService,
                          UserRepository userRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()
                    )
            );

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String token = jwtService.generateToken(userDetails);

            User user = userRepository.findByEmail(loginRequest.getEmail())
                    .orElseThrow(() -> new AuthenticationFailedException("User not found"));

            return ResponseEntity.ok(
                    new LoginResponse(
                            token,
                            user.getId(),
                            user.getEmail(),
                            user.getName(),
                            user.getRole()
                    )
            );
        } catch (BadCredentialsException e) {
            throw new AuthenticationFailedException("Invalid email or password");
        }
    }
}
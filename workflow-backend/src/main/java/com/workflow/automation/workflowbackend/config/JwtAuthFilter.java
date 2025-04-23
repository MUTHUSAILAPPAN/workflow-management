package com.workflow.automation.workflowbackend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final com.workflow.automation.workflowbackend.service.JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public JwtAuthFilter(com.workflow.automation.workflowbackend.service.JwtService jwtService,
                         UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // Debug print for incoming request
        System.out.println("Processing request to: " + request.getRequestURI());

        final String authHeader = request.getHeader("Authorization");

        // Skip if no Authorization header
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("No Bearer token found, continuing chain");
            filterChain.doFilter(request, response);
            return;
        }

        try {
            final String jwt = authHeader.substring(7);
            System.out.println("JWT Token received: " + jwt);

            final String username = jwtService.extractUsername(jwt);
            System.out.println("Extracted username from token: " + username);

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                System.out.println("Loading user details for: " + username);
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                if (jwtService.isTokenValid(jwt, userDetails)) {
                    System.out.println("Token is valid for user: " + username);

                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );

                    authToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );

                    SecurityContextHolder.getContext().setAuthentication(authToken);

                    // Debug prints (keeping your originals)
                    System.out.println("Auth token authorities: " + authToken.getAuthorities());
                    System.out.println("UserDetails authorities: " + userDetails.getAuthorities());
                    System.out.println("SecurityContext auth: " +
                            SecurityContextHolder.getContext().getAuthentication());
                } else {
                    System.out.println("Token validation failed for user: " + username);
                }
            }
        } catch (Exception e) {
            // This will catch any JWT parsing or validation errors
            System.err.println("Error processing JWT: " + e.getMessage());
            // Continue with the filter chain - let the security layer handle unauthorized requests
        }

        filterChain.doFilter(request, response);
    }
}
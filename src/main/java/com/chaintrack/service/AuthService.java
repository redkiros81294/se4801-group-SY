package com.chaintrack.service;

import com.chaintrack.dto.request.LoginRequest;
import com.chaintrack.dto.request.RegisterRequest;
import com.chaintrack.dto.response.LoginResponse;
import com.chaintrack.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Authentication and user lifecycle service.
 * All write methods are transactional. Public read methods use the least
 * privileges required by the caller's role.
 */
public interface AuthService {

    /**
     * Registers a new user. Password is BCrypt(12) hashed by the implementation.
     * Returns the saved user without passwordHash in the response.
     */
    User register(RegisterRequest request);

    /**
     * Authenticates user by email and raw password.
     * Returns a JWT token (client stores in React state only, never localStorage).
     */
    LoginResponse login(LoginRequest request);

    /**
     * Invalidates the current session's JWT token by adding it to the Redis blacklist.
     */
    void logout(String token);

    /**
     * Soft-deactivates a user (sets isActive = false). ADMIN-only.
     */
    void deactivateUser(String userId);

    Page<User> listUsers(Pageable pageable);
}

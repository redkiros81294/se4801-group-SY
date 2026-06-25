package com.chaintrack.dto.response;

import com.chaintrack.model.Role;
import com.chaintrack.model.User;
import java.time.Instant;

public record UserResponse(
    String id,
    String email,
    Role role,
    String orgId,
    boolean isActive,
    Instant createdAt,
    Instant updatedAt
) {
    public static UserResponse fromEntity(User user) {
        return new UserResponse(
            user.getId().toString(),
            user.getEmail(),
            user.getRole(),
            user.getOrg() != null ? user.getOrg().getId() : null,
            user.isActive(),
            user.getCreatedAt(),
            user.getUpdatedAt()
        );
    }
}
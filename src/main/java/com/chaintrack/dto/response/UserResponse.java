package com.chaintrack.dto.response;

import com.chaintrack.model.Role;
import com.chaintrack.model.User;
import com.chaintrack.model.UserStatus;
import java.time.Instant;

public record UserResponse(
    String id,
    String email,
    Role role,
    String orgId,
    UserStatus status,
    Instant invitedAt,
    Instant approvedAt,
    Instant rejectedAt,
    Instant createdAt,
    Instant updatedAt
) {
    public static UserResponse fromEntity(User user) {
        return new UserResponse(
            user.getId().toString(),
            user.getEmail(),
            user.getRole(),
            user.getOrg() != null ? user.getOrg().getId().toString() : null,
            user.getStatus(),
            user.getInvitedAt(),
            user.getApprovedAt(),
            user.getRejectedAt(),
            user.getCreatedAt(),
            user.getUpdatedAt()
        );
    }
}
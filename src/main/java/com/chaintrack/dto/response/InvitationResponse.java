package com.chaintrack.dto.response;

import com.chaintrack.model.Invitation;
import com.chaintrack.model.Role;
import java.time.Instant;
import java.util.UUID;

public record InvitationResponse(
    String id,
    String email,
    Role role,
    String orgId,
    String orgName,
    Invitation.InvitationStatus status,
    Instant expiresAt,
    Instant createdAt,
    String invitedByEmail
) {
    public static InvitationResponse fromEntity(Invitation invitation) {
        return new InvitationResponse(
            invitation.getId().toString(),
            invitation.getEmail(),
            invitation.getRole(),
            invitation.getOrg().getId().toString(),
            invitation.getOrg().getName(),
            invitation.getStatus(),
            invitation.getExpiresAt(),
            invitation.getCreatedAt(),
            invitation.getInvitedBy() != null ? invitation.getInvitedBy().getEmail() : null
        );
    }
}
package com.chaintrack.dto.response;

import com.chaintrack.model.Organization;
import com.chaintrack.model.Organization.OrgType;

import java.time.Instant;

/**
 * Read-only DTO returned when an Organization is fetched from the API.
 * Contains no lazy-loading JPA reference that N+1 queries or circular-imports
 * during serialization.
 */
public record OrganizationResponse(
    String id,
    String name,
    OrgType orgType,
    Instant createdAt,
    Instant updatedAt
) {
    public static OrganizationResponse fromEntity(Organization org) {
        return new OrganizationResponse(
            org.getId().toString(),
            org.getName(),
            org.getOrgType(),
            org.getCreatedAt(),
            org.getUpdatedAt()
        );
    }
}

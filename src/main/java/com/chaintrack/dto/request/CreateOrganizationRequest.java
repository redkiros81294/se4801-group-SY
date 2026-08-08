package com.chaintrack.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request payload for creating a new Organization.
 * Only ADMIN may POST /api/organizations.
 */
public record CreateOrganizationRequest(
    @NotBlank(message = "Organization name is required")
    @Size(max = 255, message = "Organization name must be at most 255 characters")
    String name,

    @NotBlank(message = "Organization type is required")
    @Size(max = 50, message = "Organization type must be at most 50 characters")
    String orgType
) {}

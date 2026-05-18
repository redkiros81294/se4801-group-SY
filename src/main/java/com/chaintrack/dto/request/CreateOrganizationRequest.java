package com.chaintrack.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request payload for creating a new Organization.
 * Only ADMIN may POST /api/organizations.
 */
public record CreateOrganizationRequest(
    @NotBlank @Size(max = 255)
    String name,

    @NotNull
    com.chaintrack.model.Organization.OrgType orgType
) {}

package com.chaintrack.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Public request to register a new organization.
 * Anyone can submit this; an ADMIN must approve it before the org becomes active.
 */
public record OrganizationRegistrationRequestDTO(
    @NotBlank @Size(max = 255)
    String companyName,

    @NotBlank @Size(max = 50)
    String orgType,

    @NotBlank @Size(max = 255)
    String contactEmail,

    @NotBlank @Size(max = 255)
    String contactName,

    @Size(max = 500)
    String message
) {}

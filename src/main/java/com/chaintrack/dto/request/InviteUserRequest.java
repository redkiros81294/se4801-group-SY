package com.chaintrack.dto.request;

import com.chaintrack.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record InviteUserRequest(
    @NotBlank @Email String email,
    @NotNull Role role,
    @NotBlank String orgId
) {}
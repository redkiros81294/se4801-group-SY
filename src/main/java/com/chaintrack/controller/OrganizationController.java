package com.chaintrack.controller;

import com.chaintrack.dto.request.CreateOrganizationRequest;
import com.chaintrack.dto.request.OrganizationRegistrationRequestDTO;
import com.chaintrack.dto.response.OrganizationResponse;
import com.chaintrack.model.OrganizationRegistrationRequest;
import com.chaintrack.repository.OrganizationRegistrationRepository;
import com.chaintrack.service.OrganizationRegistrationService;
import com.chaintrack.service.OrganizationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/organizations")
@Tag(name = "Organizations", description = "Organization management APIs")
public class OrganizationController {

    private final OrganizationService organizationService;
    private final OrganizationRegistrationService registrationService;
    private final OrganizationRegistrationRepository registrationRepository;

    public OrganizationController(OrganizationService organizationService,
                                  OrganizationRegistrationService registrationService,
                                  OrganizationRegistrationRepository registrationRepository) {
        this.organizationService = organizationService;
        this.registrationService = registrationService;
        this.registrationRepository = registrationRepository;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List all organizations", description = "Returns paginated list of all organizations (ADMIN only)")
    @ApiResponse(responseCode = "200", description = "Successful retrieval")
    @ApiResponse(responseCode = "403", description = "Forbidden - ADMIN role required")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    public Page<OrganizationResponse> listOrganizations(@PageableDefault(size = 20) Pageable pageable) {
        return organizationService.listOrganizations(pageable);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get organization by id", description = "Returns a single organization by ID (ADMIN only)")
    @ApiResponse(responseCode = "200", description = "Successful retrieval")
    @ApiResponse(responseCode = "403", description = "Forbidden - ADMIN role required")
    @ApiResponse(responseCode = "404", description = "Organization not found")
    public OrganizationResponse getOrganization(@PathVariable String id) {
        return organizationService.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create organization", description = "Creates a new organization (ADMIN only)")
    @ApiResponse(responseCode = "201", description = "Organization created successfully")
    @ApiResponse(responseCode = "400", description = "Invalid request data")
    @ApiResponse(responseCode = "403", description = "Forbidden - ADMIN role required")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @ResponseStatus(HttpStatus.CREATED)
    public OrganizationResponse createOrganization(@Valid @RequestBody CreateOrganizationRequest request) {
        return organizationService.createOrganization(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update organization", description = "Updates an existing organization (ADMIN only)")
    @ApiResponse(responseCode = "200", description = "Organization updated successfully")
    @ApiResponse(responseCode = "400", description = "Invalid request data")
    @ApiResponse(responseCode = "403", description = "Forbidden - ADMIN role required")
    @ApiResponse(responseCode = "404", description = "Organization not found")
    public OrganizationResponse updateOrganization(@PathVariable String id,
                                                   @Valid @RequestBody CreateOrganizationRequest request) {
        return organizationService.updateOrganization(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete organization", description = "Deletes an organization (ADMIN only)")
    @ApiResponse(responseCode = "204", description = "Organization deleted successfully")
    @ApiResponse(responseCode = "403", description = "Forbidden - ADMIN role required")
    @ApiResponse(responseCode = "404", description = "Organization not found")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> deleteOrganization(@PathVariable String id) {
        organizationService.deleteOrganization(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/register")
    @Operation(summary = "Public organization registration request", description = "Submit a request to register a new organization (public)")
    @ApiResponse(responseCode = "201", description = "Registration request submitted")
    @ApiResponse(responseCode = "400", description = "Invalid request data")
    @ResponseStatus(HttpStatus.CREATED)
    public OrganizationRegistrationRequest registerOrganization(@Valid @RequestBody OrganizationRegistrationRequestDTO request) {
        return registrationService.submitRegistration(request);
    }

    @GetMapping("/registrations")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List registration requests", description = "Returns paginated list of organization registration requests (ADMIN only)")
    @ApiResponse(responseCode = "200", description = "Successful retrieval")
    @ApiResponse(responseCode = "403", description = "Forbidden - ADMIN role required")
    public Page<OrganizationRegistrationRequest> listRegistrations(@PageableDefault(size = 20) Pageable pageable) {
        return registrationService.listRegistrations(pageable);
    }

    @GetMapping("/registrations/pending")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List pending registration requests", description = "Returns list of pending organization registration requests (ADMIN only)")
    @ApiResponse(responseCode = "200", description = "Successful retrieval")
    @ApiResponse(responseCode = "403", description = "Forbidden - ADMIN role required")
    public List<OrganizationRegistrationRequest> listPendingRegistrations() {
        return registrationService.listPendingRegistrations();
    }

    @PostMapping("/registrations/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Approve registration request", description = "Approves an organization registration request (ADMIN only)")
    @ApiResponse(responseCode = "200", description = "Registration request approved")
    @ApiResponse(responseCode = "403", description = "Forbidden - ADMIN role required")
    @ApiResponse(responseCode = "404", description = "Registration request not found")
    public OrganizationRegistrationRequest approveRegistration(@PathVariable String id) {
        return registrationService.approveRegistration(id);
    }

    @PostMapping("/registrations/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reject registration request", description = "Rejects an organization registration request (ADMIN only)")
    @ApiResponse(responseCode = "200", description = "Registration request rejected")
    @ApiResponse(responseCode = "403", description = "Forbidden - ADMIN role required")
    @ApiResponse(responseCode = "404", description = "Registration request not found")
    public OrganizationRegistrationRequest rejectRegistration(@PathVariable String id) {
        return registrationService.rejectRegistration(id);
    }
}

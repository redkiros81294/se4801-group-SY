package com.chaintrack.service;

import com.chaintrack.dto.request.CreateOrganizationRequest;
import com.chaintrack.dto.response.OrganizationResponse;
import com.chaintrack.model.Organization;
import com.chaintrack.model.Organization.OrgType;
import com.chaintrack.repository.OrganizationRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.apache.commons.lang3.StringUtils.isBlank;

/**
 * Service for managing supply-chain organizations.
 * <p>
 * All read methods are {@code @Transactional(readOnly = true)}.
 * All write methods are {@code @Transactional}.
 * The ADMIN restriction on writes is enforced by
 * {@code @PreAuthorize("hasRole('ADMIN')")} on the controller
 * layer — not repeated inside this service.
 * </p>
 */
@Service
@Transactional(readOnly = true)
public class OrganizationService {

    private final OrganizationRepository organizationRepository;

    public OrganizationService(OrganizationRepository organizationRepository) {
        this.organizationRepository = organizationRepository;
    }

    /**
     * Returns a paginated list of all organizations.
     * ADMIN-only at the controller via @PreAuthorize.
     */
    @Transactional(readOnly = true)
    public Page<OrganizationResponse> listOrganizations(Pageable pageable) {
        return organizationRepository.findAll(pageable)
            .map(OrganizationResponse::fromEntity);
    }

    /**
     * Returns organizations filtered by type, wrapped in a Page.
     * Uses an in-memory stream because findByOrgType returns the full list
     * and we paginate in Java — acceptable at this stage. Replace with a
     * dedicated repository method when Simon adds a Pageable overload.
     */
    @Transactional(readOnly = true)
    public Page<OrganizationResponse> listByType(OrgType orgType, Pageable pageable) {
        List<Organization> all = organizationRepository.findByOrgType(orgType);
        int start = (int) pageable.getOffset();
        if (start >= all.size()) {
            return new PageImpl<>(List.of(), pageable, all.size());
        }
        int end = Math.min(start + pageable.getPageSize(), all.size());
        List<OrganizationResponse> pageContent = all.subList(start, end).stream()
            .map(OrganizationResponse::fromEntity)
            .toList();
        return new PageImpl<>(pageContent, pageable, all.size());
    }

    /**
     * Finds a single organization by its UUID string.
     *
     * @param id the organization id
     * @return OrganizationResponse
     * @throws EntityNotFoundException        if the org does not exist
     * @throws IllegalArgumentException       if id is null or blank
     */
    @Transactional(readOnly = true)
    public OrganizationResponse findById(String id) {
        if (isBlank(id)) {
            throw new IllegalArgumentException("Organization id must not be blank");
        }
        Organization org = organizationRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException(
                "Organization with id '" + id + "' not found"));
        return OrganizationResponse.fromEntity(org);
    }

    /**
     * Creates a new organization.
     *
     * @param request validated create payload
     * @return the created OrganizationResponse
     * @throws IllegalArgumentException if name is blank or orgType is null
     */
    @Transactional
    public OrganizationResponse createOrganization(CreateOrganizationRequest request) {
        if (isBlank(request.name())) {
            throw new IllegalArgumentException("Organization name must not be blank");
        }
        if (request.orgType() == null) {
            throw new IllegalArgumentException("orgType must not be null");
        }
        Organization org = Organization.builder()
            .name(request.name())
            .orgType(request.orgType())
            .build();
        Organization saved = organizationRepository.save(org);
        return OrganizationResponse.fromEntity(saved);
    }

    /**
     * Deletes an organization by id.
     *
     * @param id the organization uuid string
     * @return true if deleted, false if not found
     */
    @Transactional
    public boolean deleteOrganization(String id) {
        if (isBlank(id)) {
            throw new IllegalArgumentException("Organization id must not be blank");
        }
        if (!organizationRepository.existsById(id)) {
            return false;
        }
        organizationRepository.deleteById(id);
        return true;
    }

    /**
     * Checks whether an organization with the given id string exists.
     */
    @Transactional(readOnly = true)
    public boolean exists(String id) {
        return organizationRepository.existsById(id);
    }
}

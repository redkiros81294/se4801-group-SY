package com.chaintrack.service;

import com.chaintrack.dto.request.OrganizationRegistrationRequestDTO;
import com.chaintrack.model.OrganizationRegistrationRequest;
import com.chaintrack.repository.OrganizationRegistrationRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.apache.commons.lang3.StringUtils.isBlank;

@Service
@Transactional(readOnly = true)
public class OrganizationRegistrationService {

    private final OrganizationRegistrationRepository registrationRepository;

    public OrganizationRegistrationService(OrganizationRegistrationRepository registrationRepository) {
        this.registrationRepository = registrationRepository;
    }

    @Transactional
    public OrganizationRegistrationRequest submitRegistration(OrganizationRegistrationRequestDTO dto) {
        if (isBlank(dto.companyName()) || isBlank(dto.orgType()) ||
            isBlank(dto.contactEmail()) || isBlank(dto.contactName())) {
            throw new IllegalArgumentException("Required registration fields are missing");
        }

        OrganizationRegistrationRequest request = OrganizationRegistrationRequest.builder()
            .companyName(dto.companyName())
            .orgType(dto.orgType())
            .contactEmail(dto.contactEmail())
            .contactName(dto.contactName())
            .message(dto.message())
            .status(OrganizationRegistrationRequest.Status.PENDING)
            .build();

        return registrationRepository.save(request);
    }

    @Transactional(readOnly = true)
    public Page<OrganizationRegistrationRequest> listRegistrations(Pageable pageable) {
        return registrationRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public List<OrganizationRegistrationRequest> listPendingRegistrations() {
        return registrationRepository.findByStatus(OrganizationRegistrationRequest.Status.PENDING);
    }

    @Transactional
    public OrganizationRegistrationRequest approveRegistration(String id) {
        OrganizationRegistrationRequest request = registrationRepository.findById(java.util.UUID.fromString(id))
            .orElseThrow(() -> new EntityNotFoundException("Registration request not found"));
        request.setStatus(OrganizationRegistrationRequest.Status.APPROVED);
        return registrationRepository.save(request);
    }

    @Transactional
    public OrganizationRegistrationRequest rejectRegistration(String id) {
        OrganizationRegistrationRequest request = registrationRepository.findById(java.util.UUID.fromString(id))
            .orElseThrow(() -> new EntityNotFoundException("Registration request not found"));
        request.setStatus(OrganizationRegistrationRequest.Status.REJECTED);
        return registrationRepository.save(request);
    }
}

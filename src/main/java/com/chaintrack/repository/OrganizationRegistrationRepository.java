package com.chaintrack.repository;

import com.chaintrack.model.OrganizationRegistrationRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrganizationRegistrationRepository extends JpaRepository<OrganizationRegistrationRequest, UUID> {
    List<OrganizationRegistrationRequest> findByStatus(OrganizationRegistrationRequest.Status status);
}

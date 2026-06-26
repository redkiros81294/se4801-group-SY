package com.chaintrack.repository;

import com.chaintrack.model.Organization;
import com.chaintrack.model.Organization.OrgType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, UUID> {
    List<Organization> findByOrgType(OrgType orgType);

    Page<Organization> findByOrgType(OrgType orgType, Pageable pageable);
}
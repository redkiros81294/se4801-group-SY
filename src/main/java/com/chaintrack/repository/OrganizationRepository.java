package com.chaintrack.repository;

import com.chaintrack.model.Organization;
import com.chaintrack.model.Organization.OrgType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, String> {
    List<Organization> findByOrgType(OrgType orgType);
}
package com.chaintrack.service;

import com.chaintrack.dto.request.CreateOrganizationRequest;
import com.chaintrack.dto.response.OrganizationResponse;
import com.chaintrack.model.Organization;
import com.chaintrack.model.Organization.OrgType;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Service-level tests for {@link OrganizationService}.
 * Uses @DataJpaTest — only JPA layer + imported service beans are loaded.
 * Flyway excluded so Hibernate DDL-auto=create-drop handles schema.
 */
@DataJpaTest(excludeAutoConfiguration = org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration.class)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@Import(OrganizationService.class)
class OrganizationServiceTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private OrganizationService organizationService;

    private Organization mfrA;
    private Organization mfrB;
    private Organization shipperA;

    @BeforeEach
    void setUp() {
        mfrA = Organization.builder()
            .name("PharmaCorp Manufacturing")
            .orgType(OrgType.MANUFACTURER)
            .build();

        mfrB = Organization.builder()
            .name("MediGen Ltd.")
            .orgType(OrgType.MANUFACTURER)
            .build();

        shipperA = Organization.builder()
            .name("FastTrack Logistics")
            .orgType(OrgType.SHIPPER)
            .build();

        entityManager.persistAndFlush(mfrA);
        entityManager.persistAndFlush(mfrB);
        entityManager.persistAndFlush(shipperA);
    }

    // ── listOrganizations ────────────────────────────────────────────────

    @Test
    @DisplayName("listOrganizations — returns all 3 orgs on first page")
    void listOrganizations_shouldReturnAllOrgsOnFirstPage() {
        Page<OrganizationResponse> page = organizationService.listOrganizations(PageRequest.ofSize(10));

        assertThat(page.getContent()).hasSize(3);
        assertThat(page.getTotalElements()).isEqualTo(3);
    }

    // ── listByType ──────────────────────────────────────────────────────

    @Test
    @DisplayName("listByType(MANUFACTURER) — returns only manufacturers, totalElements=2")
    void listByType_manufacturer_firstPage() {
        Page<OrganizationResponse> page = organizationService.listByType(
            OrgType.MANUFACTURER, PageRequest.ofSize(10));

        assertThat(page.getContent()).hasSize(2);
        assertThat(page.getTotalElements()).isEqualTo(2);
        assertThat(page.getContent())
            .extracting(OrganizationResponse::orgType)
            .containsOnly(OrgType.MANUFACTURER);
    }

    @Test
    @DisplayName("listByType(SHIPPER) — returns only the one shipper org")
    void listByType_shipper_returnsOnlyShipper() {
        Page<OrganizationResponse> page = organizationService.listByType(
            OrgType.SHIPPER, PageRequest.ofSize(10));

        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getContent().get(0).orgType()).isEqualTo(OrgType.SHIPPER);
    }

    @Test
    @DisplayName("listByType — second page is empty when total fits on page 1")
    void listByType_secondPageEmpty_whenAllFitOnPage1() {
        Page<OrganizationResponse> page = organizationService.listByType(
            OrgType.MANUFACTURER, PageRequest.of(1, 10));

        assertThat(page.getContent()).isEmpty();
    }

    // ── findById ────────────────────────────────────────────────────────

    @Test
    @DisplayName("findById — returns OrganizationResponse when id exists")
    void findById_shouldReturnOrg_whenExists() {
        OrganizationResponse found = organizationService.findById(mfrA.getId());

        assertThat(found).isNotNull();
        assertThat(found.name()).isEqualTo("PharmaCorp Manufacturing");
        assertThat(found.orgType()).isEqualTo(OrgType.MANUFACTURER);
    }

    @Test
    @DisplayName("findById — throws IllegalArgumentException when id is null")
    void findById_shouldThrow_whenIdIsNull() {
        assertThatThrownBy(() -> organizationService.findById(null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("must not be blank");
    }

    @Test
    @DisplayName("findById — throws JPA EntityNotFoundException when id not found")
    void findById_shouldThrow_whenIdNotFound() {
        assertThatThrownBy(() ->
            organizationService.findById("00000000-0000-0000-0000-000000000001"))
            .isInstanceOf(jakarta.persistence.EntityNotFoundException.class);
    }

    // ── createOrganization ──────────────────────────────────────────────

    @Test
    @DisplayName("createOrganization — persists and returns DTO with generated id")
    void createOrganization_shouldPersistAndReturnSavedOrg() {
        CreateOrganizationRequest req = new CreateOrganizationRequest(
            "New Manufacturer",
            OrgType.MANUFACTURER);

        OrganizationResponse created = organizationService.createOrganization(req);

        // Verify the DTO round-trips the persisted entity
        assertThat(created.id()).isNotBlank();
        assertThat(created.name()).isEqualTo("New Manufacturer");
        assertThat(created.orgType()).isEqualTo(OrgType.MANUFACTURER);
    }

    @Test
    @DisplayName("createOrganization — throws IllegalArgumentException when name is blank")
    void createOrganization_shouldThrow_whenNameIsBlank() {
        CreateOrganizationRequest req = new CreateOrganizationRequest("", OrgType.MANUFACTURER);

        assertThatThrownBy(() -> organizationService.createOrganization(req))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("name");
    }

    @Test
    @DisplayName("createOrganization — throws IllegalArgumentException when orgType is null")
    void createOrganization_shouldThrow_whenOrgTypeIsNull() {
        CreateOrganizationRequest req = new CreateOrganizationRequest("Test", null);

        assertThatThrownBy(() -> organizationService.createOrganization(req))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("orgType");
    }

    // ── deleteOrganization ──────────────────────────────────────────────

    @Test
    @DisplayName("deleteOrganization — returns true when org is deleted")
    void deleteOrganization_shouldReturnTrue_whenDeleted() {
        boolean deleted = organizationService.deleteOrganization(mfrA.getId());

        assertThat(deleted).isTrue();
    }

    @Test
    @DisplayName("deleteOrganization — returns false when org does not exist")
    void deleteOrganization_shouldReturnFalse_whenNotFound() {
        boolean deleted = organizationService.deleteOrganization("00000000-0000-0000-0000-000000000000");

        assertThat(deleted).isFalse();
    }

    // ── exists ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("exists — should return true for existing org id")
    void exists_shouldReturnTrue_forExistingOrg() {
        assertThat(organizationService.exists(mfrA.getId())).isTrue();
    }

    @Test
    @DisplayName("exists — should return false for non-existent org id")
    void exists_shouldReturnFalse_forUnknownOrg() {
        assertThat(organizationService.exists("00000000-0000-0000-0000-000000000000")).isFalse();
    }
}

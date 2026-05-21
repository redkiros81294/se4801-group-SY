package com.chaintrack.service;

import com.chaintrack.dto.request.CreateBatchRequest;
import com.chaintrack.dto.response.GenerateBatchTokenResponse;
import com.chaintrack.model.*;
import com.chaintrack.repository.OrganizationRepository;
import com.chaintrack.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest(excludeAutoConfiguration = org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration.class)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@Import({BatchServiceImpl.class, QRCodeService.class})
class BatchServiceTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private BatchService batchService;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private ProductRepository productRepository;

    private Organization manufacturerOrg;
    private Product product;

    @BeforeEach
    void setUp() {
        manufacturerOrg = Organization.builder()
            .name("Test Pharma Ltd.")
            .orgType(Organization.OrgType.MANUFACTURER)
            .build();
        entityManager.persistAndFlush(manufacturerOrg);

        product = Product.builder()
            .sku("SKU-TEST-001")
            .name("Test Product")
            .category("Medicine")
            .manufacturer(manufacturerOrg)
            .createdBy(UUID.randomUUID())
            .build();
        entityManager.persistAndFlush(product);
    }

    // ── createBatch ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("createBatch — creates batch with correct batch number format")
    void createBatch_createsBatchWithCorrectFormat() {
        CreateBatchRequest request = new CreateBatchRequest(
            product.getId(),
            null,
            manufacturerOrg.getId()
        );

        Batch batch = batchService.createBatch(request);

        assertThat(batch.getId()).isNotBlank();
        assertThat(batch.getBatchNumber()).startsWith("SKU-TEST-001-");
        assertThat(batch.getStatus()).isEqualTo(BatchStatus.CREATED);
        assertThat(batch.getManufacturer().getId()).isEqualTo(manufacturerOrg.getId());
    }

    @Test
    @DisplayName("createBatch — rejects non-manufacturer owner (BOLA check)")
    void createBatch_rejectsNonManufacturerOwner() {
        Organization otherOrg = Organization.builder()
            .name("Other Company")
            .orgType(Organization.OrgType.SHIPPER)
            .build();
        entityManager.persistAndFlush(otherOrg);

        CreateBatchRequest request = new CreateBatchRequest(
            product.getId(),
            null,
            otherOrg.getId()
        );

        assertThatThrownBy(() -> batchService.createBatch(request))
            .isInstanceOf(com.chaintrack.exception.AccessDeniedException.class);
    }

    // ── getBatchById ────────────────────────────────────────────────────────

    @Test
    @DisplayName("getBatchById — returns batch when exists")
    void getBatchById_returnsBatch_whenExists() {
        CreateBatchRequest request = new CreateBatchRequest(
            product.getId(),
            null,
            manufacturerOrg.getId()
        );
        Batch created = batchService.createBatch(request);

        Batch found = batchService.getBatchById(created.getId());

        assertThat(found.getId()).isEqualTo(created.getId());
        assertThat(found.getBatchNumber()).isEqualTo(created.getBatchNumber());
    }

    @Test
    @DisplayName("getBatchById — throws ResourceNotFoundException when missing")
    void getBatchById_throws_whenNotFound() {
        assertThatThrownBy(() -> batchService.getBatchById("00000000-0000-0000-0000-000000000000"))
            .isInstanceOf(com.chaintrack.exception.ResourceNotFoundException.class);
    }

    // ── advanceStatus ──────────────────────────────────────────────────────

    @Test
    @DisplayName("advanceStatus — changes status when actor owns batch")
    void advanceStatus_changesStatus_whenActorOwns() {
        CreateBatchRequest request = new CreateBatchRequest(
            product.getId(),
            null,
            manufacturerOrg.getId()
        );
        Batch batch = batchService.createBatch(request);

        Batch updated = batchService.advanceStatus(
            batch.getId(), BatchStatus.IN_TRANSIT, manufacturerOrg.getId());

        assertThat(updated.getStatus()).isEqualTo(BatchStatus.IN_TRANSIT);
    }

    @Test
    @DisplayName("advanceStatus — rejects non-owner (BOLA check)")
    void advanceStatus_rejectsNonOwner() {
        Organization otherOrg = Organization.builder()
            .name("Other Company")
            .orgType(Organization.OrgType.SHIPPER)
            .build();
        entityManager.persistAndFlush(otherOrg);

        CreateBatchRequest request = new CreateBatchRequest(
            product.getId(),
            null,
            manufacturerOrg.getId()
        );
        Batch batch = batchService.createBatch(request);

        assertThatThrownBy(() ->
            batchService.advanceStatus(batch.getId(), BatchStatus.IN_TRANSIT, otherOrg.getId()))
            .isInstanceOf(com.chaintrack.exception.AccessDeniedException.class);
    }

    // ── generateQR ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("generateQR — creates QR token and image")
    void generateQR_createsTokenAndImage() {
        CreateBatchRequest request = new CreateBatchRequest(
            product.getId(),
            null,
            manufacturerOrg.getId()
        );
        Batch batch = batchService.createBatch(request);

        GenerateBatchTokenResponse response = ((BatchServiceImpl) batchService).generateQR(batch.getId());

        assertThat(response.batchId()).isEqualTo(batch.getId());
        assertThat(response.tokenValue()).isNotNull();
        assertThat(response.qrImage()).isNotBlank();
        assertThat(response.qrImage()).startsWith("iVBORw0KGgo");
    }
}
package com.chaintrack.repository;

import com.chaintrack.model.Batch;
import com.chaintrack.model.BatchStatus;
import com.chaintrack.model.Organization;
import com.chaintrack.model.Organization.OrgType;
import com.chaintrack.model.Product;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Repository tests for {@link BatchRepository}.
 * Verifies derived queries and org-scoping behaviour.
 *
 * Flyway is excluded so Hibernate DDL auto-creation is used instead.
 * PostgreSQL-specific SQL in V1–V7 would break the H2 in-memory database.
 */
@DataJpaTest(excludeAutoConfiguration = org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration.class)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
class BatchRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private BatchRepository batchRepository;

    // keep TestEntityManager for DB operations in tests, raw EntityManager not used

    private Organization manufacturerOrg;
    private Organization shipperOrg;
    private Product product;

    @BeforeEach
    void setUp() {
        manufacturerOrg = Organization.builder()
            .name("Test Manufacturer Ltd.")
            .orgType(OrgType.MANUFACTURER)
            .build();
        entityManager.persistAndFlush(manufacturerOrg);

        shipperOrg = Organization.builder()
            .name("Test Shipper Ltd.")
            .orgType(OrgType.SHIPPER)
            .build();
        entityManager.persistAndFlush(shipperOrg);

        product = Product.builder()
            .sku("SKU-BATCH")
            .name("Batch Test Product")
            .manufacturer(manufacturerOrg)
            .createdBy(java.util.UUID.randomUUID())
            .build();
        entityManager.persistAndFlush(product);

        // Seed 4 batches: 2 for manufacturerOrg (CREATED + IN_TRANSIT),
        //                 1 for shipperOrg   (DELIVERED)
        seq(manufacturerOrg, product, "BATCH-C-001", BatchStatus.CREATED);
        seq(manufacturerOrg, product, "BATCH-C-002", BatchStatus.CREATED);
        seq(manufacturerOrg, product, "BATCH-IT-001", BatchStatus.IN_TRANSIT);
        seq(shipperOrg,       product, "BATCH-D-001", BatchStatus.DELIVERED);
    }

    private Batch seq(Organization org, Product prod, String batchNumber, BatchStatus status) {
        Batch b = Batch.builder()
            .batchNumber(batchNumber)
            .product(prod)
            .status(status)
            .manufacturer(org)
            .build();
        entityManager.persistAndFlush(b);
        return b;
    }

    // ── Test 1 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("findByProductAndStatus — should return only batches matching product and status")
    void findByProductAndStatus_shouldReturnMatchingRows() {
        // Act
        List<Batch> results = batchRepository.findByProductAndStatus(product, BatchStatus.CREATED);

        // Assert — 2 CREATED batches belonging to manufacturerOrg
        assertThat(results)
            .hasSize(2)
            .extracting(Batch::getBatchNumber)
            .containsExactlyInAnyOrder("BATCH-C-001", "BATCH-C-002");
    }

    // ── Test 2 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("findByProductAndStatus — should return empty list when no batch matches")
    void findByProductAndStatus_shouldReturnEmpty_whenNoMatch() {
        // Act — product exists but no DELIVERED batches for it yet (shipper batch has different product FK in real schema, but here product is same; query uses passed-in product, so DELIVERED batch matches it. Let's test with a non-existent product id instead.)
        Product otherProduct = Product.builder()
            .sku("SKU-OTHER")
            .name("Other Product")
            .manufacturer(manufacturerOrg)
            .createdBy(java.util.UUID.randomUUID())
            .build();
        entityManager.persistAndFlush(otherProduct);

        List<Batch> results = batchRepository.findByProductAndStatus(otherProduct, BatchStatus.DELIVERED);

        // Assert
        assertThat(results).isEmpty();
    }

    // ── Test 3 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("findByManufacturer — should return all batches for a given org")
    void findByManufacturer_shouldReturnBatchesForOrg() {
        // Act — manufacturerOrg has 3 batches; shipperOrg has 1
        List<Batch> mfrBatches = batchRepository.findByManufacturer(manufacturerOrg);

        // Assert
        assertThat(mfrBatches)
            .hasSize(3)
            .extracting(Batch::getBatchNumber)
            .containsExactlyInAnyOrder("BATCH-C-001", "BATCH-C-002", "BATCH-IT-001");
    }

    // ── Test 4 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("findByManufacturer — should NOT return batches owned by another org (BOLA scoping check)")
    void findByManufacturer_shouldNotReturnOtherOrgsBatches() {
        // Act
        List<Batch> mfrBatches = batchRepository.findByManufacturer(manufacturerOrg);

        // Assert — shipperOrg's batch must NOT appear in manufacturer's list
        assertThat(mfrBatches)
            .extracting(Batch::getBatchNumber)
            .doesNotContain("BATCH-D-001");
    }

    // ── Test 5 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("findByManufacturer — should return empty list for org with no batches")
    void findByManufacturer_shouldReturnEmptyForNewOrg() {
        // Arrange
        Organization emptyOrg = Organization.builder()
            .name("Empty Org")
            .orgType(OrgType.SHIPPER)
            .build();
        entityManager.persistAndFlush(emptyOrg);

        // Act
        List<Batch> results = batchRepository.findByManufacturer(emptyOrg);

        // Assert
        assertThat(results).isEmpty();
    }
}

package com.chaintrack.repository;

import com.chaintrack.model.Batch;
import com.chaintrack.model.MovementTransaction;
import com.chaintrack.model.MovementTransaction.EventType;
import com.chaintrack.model.Organization;
import com.chaintrack.model.Organization.OrgType;
import com.chaintrack.model.Product;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(excludeAutoConfiguration = org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration.class)
@AutoConfigureTestDatabase(replace = Replace.ANY)
class MovementTransactionRepositoryTest {

    private static final Logger log = LoggerFactory.getLogger(MovementTransactionRepositoryTest.class);

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private MovementTransactionRepository movementTransactionRepository;

    @Autowired
    private EntityManager em;

    private Organization manufacturer;
    private Product product;
    private Batch batch;

    @BeforeEach
    void setUp() {
        // 1. Create and persist an Organization (orgType = MANUFACTURER)
        manufacturer = new Organization();
        manufacturer.setName("Test Manufacturer");
        manufacturer.setOrgType(OrgType.MANUFACTURER);
        manufacturer = entityManager.persistAndFlush(manufacturer);

        // 2. Create and persist a Product linked to that org (SKU = "SKU-TEST", name = "Test Product")
        product = new Product();
        product.setSku("SKU-TEST");
        product.setName("Test Product");
        product.setManufacturer(manufacturer);
        product.setCreatedBy(UUID.randomUUID());
        product = entityManager.persistAndFlush(product);

        // 3. Create and persist a Batch linked to that product (batchNumber = "BATCH-TEST-001")
        batch = new Batch();
        batch.setBatchNumber("BATCH-TEST-001");
        batch.setProduct(product);
        batch.setStatus(com.chaintrack.model.BatchStatus.CREATED);
        batch.setManufacturer(manufacturer);
        batch = entityManager.persistAndFlush(batch);

        // 4. Persist 3 MovementTransaction rows for that batch with DIFFERENT event_timestamp values
        MovementTransaction tx1 = MovementTransaction.builder()
                .eventType(EventType.MANUFACTURED)
                .eventTimestamp(Instant.parse("2025-01-01T10:00:00Z"))
                .signatureHash("aaa111bbb222ccc333ddd444eee555fff666ggg777hhh888")
                .previousHash("GENESIS")
                .batch(batch)
                .build();
        entityManager.persistAndFlush(tx1);

        MovementTransaction tx2 = MovementTransaction.builder()
                .eventType(EventType.SHIPPED)
                .eventTimestamp(Instant.parse("2025-01-01T11:00:00Z"))
                .signatureHash("bbb222ccc333ddd444eee555fff666ggg777hhh888iii999")
                .previousHash(tx1.getSignatureHash())
                .batch(batch)
                .build();
        entityManager.persistAndFlush(tx2);

        MovementTransaction tx3 = MovementTransaction.builder()
                .eventType(EventType.IN_TRANSIT)
                .eventTimestamp(Instant.parse("2025-01-01T12:00:00Z"))
                .signatureHash("ccc333ddd444eee555fff666ggg777hhh888iii999jjj000")
                .previousHash(tx2.getSignatureHash())
                .batch(batch)
                .build();
        entityManager.persistAndFlush(tx3);

        entityManager.clear();
    }

    @Test
    void should_findByBatchOrderByEventTimestampAsc_returnsAllRowsInChronologicalOrder() {
        // Arrange
        em.flush();
        em.clear();

        // Act
        List<MovementTransaction> result = movementTransactionRepository.findByBatchOrderByEventTimestampAsc(batch);

        // Assert
        assertThat(result).hasSize(3);
        assertThat(result.get(0).getEventType()).isEqualTo(EventType.MANUFACTURED);
        assertThat(result.get(1).getEventType()).isEqualTo(EventType.SHIPPED);
        assertThat(result.get(2).getEventType()).isEqualTo(EventType.IN_TRANSIT);
    }

    @Test
    void should_findByBatchOrderByEventTimestampAsc_returnsEmptyListForUnknownBatch() {
        // Arrange
        em.flush();
        em.clear();
        Batch unknownBatch = new Batch();
        unknownBatch.setId("99999999-9999-9999-9999-999999999999");
        unknownBatch.setVersion(0L);

        // Act
        List<MovementTransaction> result = movementTransactionRepository.findByBatchOrderByEventTimestampAsc(unknownBatch);

        // Assert
        assertThat(result).isEmpty();
    }

    @Test
    void should_findTopByBatchOrderByEventTimestampDesc_returnsMostRecentEvent() {
        // Arrange
        em.flush();
        em.clear();

        // Act
        Optional<MovementTransaction> result = movementTransactionRepository.findTopByBatchOrderByEventTimestampDesc(batch);

        // Assert
        assertThat(result).isPresent();
        assertThat(result.get().getEventType()).isEqualTo(EventType.IN_TRANSIT);
    }

    @Test
    void should_findTopByBatchOrderByEventTimestampDesc_returnsEmptyOptionalForEmptyBatch() {
        // Arrange
        em.flush();
        em.clear();
        Batch unknownBatch = new Batch();
        unknownBatch.setId("99999999-9999-9999-9999-999999999999");
        unknownBatch.setVersion(0L);

        // Act
        Optional<MovementTransaction> result = movementTransactionRepository.findTopByBatchOrderByEventTimestampDesc(unknownBatch);

        // Assert
        assertThat(result).isEmpty();
    }

    @Test
    void should_persist_hibernateGeneratesIdAndCreatedAt() {
        // Arrange
        MovementTransaction tx = MovementTransaction.builder()
                .eventType(EventType.RECEIVED)
                .eventTimestamp(Instant.parse("2025-01-01T13:00:00Z"))
                .signatureHash("ddd444eee555fff666ggg777hhh888iii999jjj000kkk111")
                .previousHash("previousHashPlaceholder")
                .batch(batch)
                .build();

        // Act
        MovementTransaction saved = entityManager.persistAndFlush(tx);

        // Assert
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCreatedAt()).isNotNull();
    }
}
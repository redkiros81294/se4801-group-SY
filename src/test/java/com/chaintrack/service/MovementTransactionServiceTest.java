package com.chaintrack.service;

import com.chaintrack.model.*;
import com.chaintrack.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(excludeAutoConfiguration = org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration.class)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@Import({MovementTransactionServiceImpl.class, SHA256HashServiceImpl.class})
class MovementTransactionServiceTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private MovementTransactionService movementService;

    @Autowired
    private BatchRepository batchRepository;

    @Autowired
    private MovementTransactionRepository transactionRepository;

    private Batch batch;
    private Organization manufacturer;

    @BeforeEach
    void setUp() {
        manufacturer = Organization.builder()
            .name("Test Manufacturer")
            .orgType(Organization.OrgType.MANUFACTURER)
            .build();
        entityManager.persistAndFlush(manufacturer);

        Product product = Product.builder()
            .sku("SKU-MOVEMENT")
            .name("Test Product")
            .manufacturer(manufacturer)
            .createdBy(UUID.randomUUID())
            .build();
        entityManager.persistAndFlush(product);

        batch = Batch.builder()
            .batchNumber("SKU-MOVEMENT-20240101-abc123")
            .product(product)
            .status(BatchStatus.CREATED)
            .manufacturer(manufacturer)
            .build();
        entityManager.persistAndFlush(batch);
    }

    @Test
    @DisplayName("recordMovement — creates movement with correct signature hash")
    void recordMovement_createsMovementWithSignature() {
        CreateMovementRequest request = new CreateMovementRequest() {
            @Override public String eventType() { return "MANUFACTURED"; }
            @Override public String batchId() { return batch.getId(); }
            @Override public String fromOrgId() { return null; }
            @Override public String toOrgId() { return null; }
            @Override public String signatureHash() { return ""; }
            @Override public String previousHash() { return ""; }
            @Override public String tokenValue() { return ""; }
        };

        MovementTransaction result = movementService.recordMovement(request);

        assertThat(result.getEventType()).isEqualTo(MovementTransaction.EventType.MANUFACTURED);
        assertThat(result.getPreviousHash()).isEqualTo("GENESIS");
        assertThat(result.getSignatureHash()).isNotBlank().hasSize(64);
    }

    @Test
    @DisplayName("getChainForBatch — returns ordered list of transactions")
    void getChainForBatch_returnsOrderedChain() {
        CreateMovementRequest genesis = new CreateMovementRequest() {
            @Override public String eventType() { return "MANUFACTURED"; }
            @Override public String batchId() { return batch.getId(); }
            @Override public String fromOrgId() { return null; }
            @Override public String toOrgId() { return null; }
            @Override public String signatureHash() { return ""; }
            @Override public String previousHash() { return ""; }
            @Override public String tokenValue() { return ""; }
        };
        movementService.recordMovement(genesis);

        CreateMovementRequest shipped = new CreateMovementRequest() {
            @Override public String eventType() { return "SHIPPED"; }
            @Override public String batchId() { return batch.getId(); }
            @Override public String fromOrgId() { return manufacturer.getId(); }
            @Override public String toOrgId() { return "org-shipper"; }
            @Override public String signatureHash() { return ""; }
            @Override public String previousHash() { return ""; }
            @Override public String tokenValue() { return ""; }
        };
        movementService.recordMovement(shipped);

        List<MovementTransaction> chain = movementService.getChainForBatch(batch.getId());

        assertThat(chain).hasSize(2);
        assertThat(chain.get(0).getEventType()).isEqualTo(MovementTransaction.EventType.MANUFACTURED);
        assertThat(chain.get(1).getEventType()).isEqualTo(MovementTransaction.EventType.SHIPPED);
    }
}
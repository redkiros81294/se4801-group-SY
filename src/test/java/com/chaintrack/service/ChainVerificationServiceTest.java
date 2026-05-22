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

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(excludeAutoConfiguration = org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration.class)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@Import({ChainVerificationService.class, SHA256HashServiceImpl.class})
class ChainVerificationServiceTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private ChainVerificationService verificationService;

    @Autowired
    private BatchRepository batchRepository;

    @Autowired
    private MovementTransactionRepository movementRepository;

    private Batch batch;
    private HashService hashService;

    @BeforeEach
    void setUp() {
        hashService = new SHA256HashServiceImpl();
        
        Organization manufacturer = Organization.builder()
            .name("Test Manufacturer")
            .orgType(Organization.OrgType.MANUFACTURER)
            .build();
        entityManager.persistAndFlush(manufacturer);

        Product product = Product.builder()
            .sku("SKU-TEST")
            .name("Test Product")
            .manufacturer(manufacturer)
            .createdBy(UUID.randomUUID())
            .build();
        entityManager.persistAndFlush(product);

        batch = Batch.builder()
            .batchNumber("SKU-TEST-20240101-abc123")
            .product(product)
            .status(BatchStatus.CREATED)
            .manufacturer(manufacturer)
            .build();
        entityManager.persistAndFlush(batch);
    }

    @Test
    @DisplayName("verifyChain — empty chain returns VALID")
    void verifyChain_emptyChain_returnsValid() {
        assertThat(verificationService.verifyChain(batch.getId()))
            .isEqualTo(ChainStatus.VALID);
    }

    @Test
    @DisplayName("verifyChain — valid chain returns VALID")
    void verifyChain_validChain_returnsValid() {
        // Create genesis movement
        MovementTransaction genesis = createMovement(
            batch, MovementTransaction.EventType.MANUFACTURED,
            null, "org-1", "GENESIS"
        );
        entityManager.persistAndFlush(genesis);

        // Create second movement
        MovementTransaction shipped = createMovement(
            batch, MovementTransaction.EventType.SHIPPED,
            "org-1", "org-2", genesis.getSignatureHash()
        );
        entityManager.persistAndFlush(shipped);

        assertThat(verificationService.verifyChain(batch.getId()))
            .isEqualTo(ChainStatus.VALID);
    }

    @Test
    @DisplayName("verifyChain — tampered signature returns COMPROMISED")
    void verifyChain_tamperedSignature_returnsCompromised() {
        MovementTransaction genesis = createMovement(
            batch, MovementTransaction.EventType.MANUFACTURED,
            null, "org-1", "GENESIS"
        );
        entityManager.persistAndFlush(genesis);

        // Tamper with the signature
        genesis.setSignatureHash("tampered_hash_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
        entityManager.persistAndFlush(genesis);

        assertThat(verificationService.verifyChain(batch.getId()))
            .isEqualTo(ChainStatus.COMPROMISED);
    }

private MovementTransaction createMovement(Batch batch, MovementTransaction.EventType eventType,
                                                         String fromOrgId, String toOrgId, String previousHash) {
        // Use the same timestamp for both hash computation and entity to ensure consistency
        Instant timestamp = Instant.now();
        
        String signature = hashService.chainHash(
            eventType.name(),
            timestamp.toString(),
            fromOrgId,
            toOrgId,
            previousHash
        );

        return MovementTransaction.builder()
            .eventType(eventType)
            .eventTimestamp(timestamp)
            .fromOrgId(fromOrgId)
            .toOrgId(toOrgId)
            .batch(batch)
            .signatureHash(signature)
            .previousHash(previousHash)
            .build();
    }
}
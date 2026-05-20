package com.chaintrack.repository;

import com.chaintrack.model.Batch;
import com.chaintrack.model.Organization;
import com.chaintrack.model.Organization.OrgType;
import com.chaintrack.model.Product;
import com.chaintrack.model.QRToken;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(excludeAutoConfiguration = org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration.class)
@AutoConfigureTestDatabase(replace = Replace.ANY)
class QRTokenRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private QRTokenRepository qrTokenRepository;

    private Organization manufacturer;
    private Product product;
    private Batch batch;

    @BeforeEach
    void setUp() {
        manufacturer = new Organization();
        manufacturer.setName("Test Manufacturer");
        manufacturer.setOrgType(OrgType.MANUFACTURER);
        manufacturer = entityManager.persistAndFlush(manufacturer);

        product = new Product();
        product.setSku("SKU-QRTEST");
        product.setName("QR Test Product");
        product.setManufacturer(manufacturer);
        product.setCreatedBy(UUID.fromString("00000000-0000-0000-0000-000000000001"));
        product = entityManager.persistAndFlush(product);

        batch = new Batch();
        batch.setBatchNumber("BATCH-QRTEST-001");
        batch.setProduct(product);
        batch.setStatus(com.chaintrack.model.BatchStatus.CREATED);
        batch.setManufacturer(manufacturer);
        batch = entityManager.persistAndFlush(batch);
    }

    @Test
    void should_findByTokenValue_returnsToken_whenTokenExists() {
        QRToken token = QRToken.builder()
                .tokenValue(UUID.randomUUID())
                .qrImage("base64imagedata123")
                .batch(batch)
                .build();
        QRToken saved = entityManager.persistAndFlush(token);

        Optional<QRToken> result = qrTokenRepository.findByTokenValue(saved.getTokenValue());

        assertThat(result).isPresent();
        assertThat(result.get().getQrImage()).isEqualTo("base64imagedata123");
    }

    @Test
    void should_findByTokenValue_returnsEmpty_whenTokenNotFound() {
        Optional<QRToken> result = qrTokenRepository.findByTokenValue(UUID.randomUUID());

        assertThat(result).isEmpty();
    }

    @Test
    void should_findByBatch_returnsToken_whenBatchHasToken() {
        QRToken token = QRToken.builder()
                .tokenValue(UUID.randomUUID())
                .qrImage("base64imagedata456")
                .batch(batch)
                .build();
        entityManager.persistAndFlush(token);

        Optional<QRToken> result = qrTokenRepository.findByBatch(batch);

        assertThat(result).isPresent();
        assertThat(result.get().getBatch().getId()).isEqualTo(batch.getId());
    }

    @Test
    void should_findByBatch_returnsEmpty_whenBatchHasNoToken() {
        entityManager.clear();

        Optional<QRToken> result = qrTokenRepository.findByBatch(batch);

        assertThat(result).isEmpty();
    }

    @Test
    void should_persist_hibernateGeneratesIdAndTimestamps() {
        QRToken token = QRToken.builder()
                .tokenValue(UUID.randomUUID())
                .qrImage("base64testimage")
                .batch(batch)
                .build();

        QRToken saved = entityManager.persistAndFlush(token);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getVersion()).isNotNull();
    }
}
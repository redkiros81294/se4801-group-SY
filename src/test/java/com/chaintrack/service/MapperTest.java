package com.chaintrack.service;

import com.chaintrack.dto.response.BatchResponse;
import com.chaintrack.dto.response.MovementResponse;
import com.chaintrack.dto.response.ProductResponse;
import com.chaintrack.model.*;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class MapperTest {

    private final ProductMapper productMapper = new ProductMapper();
    private final BatchMapper batchMapper = new BatchMapper();
    private final TransactionMapper transactionMapper = new TransactionMapper();

    @Test
    @DisplayName("ProductMapper converts entity to DTO")
    void testProductMapper() {
        Organization manufacturer = new Organization();
        manufacturer.setId("org-1");
        manufacturer.setName("Test Manufacturer");
        manufacturer.setOrgType(Organization.OrgType.MANUFACTURER);

        Product product = new Product();
        product.setId("prod-1");
        product.setSku("SKU-123");
        product.setName("Test Product");
        product.setDescription("A test product");
        product.setCategory("Category");
        product.setManufacturer(manufacturer);
        product.setCreatedBy(UUID.randomUUID());
        product.setCreatedAt(Instant.parse("2024-01-01T10:00:00Z"));
        product.setUpdatedAt(Instant.parse("2024-01-02T10:00:00Z"));

        ProductResponse dto = productMapper.toDto(product);
        assertNotNull(dto);
        assertEquals("prod-1", dto.id());
        assertEquals("SKU-123", dto.sku());
        assertEquals("Test Product", dto.name());
        assertEquals("A test product", dto.description());
        assertEquals("Category", dto.category());
        assertEquals("org-1", dto.manufacturerId());
        assertEquals(Instant.parse("2024-01-01T10:00:00Z"), dto.createdAt());
        assertEquals(Instant.parse("2024-01-02T10:00:00Z"), dto.updatedAt());
    }

    @Test
    @DisplayName("BatchMapper converts entity to DTO")
    void testBatchMapper() {
        Organization manufacturer = new Organization();
        manufacturer.setId("org-1");
        manufacturer.setName("Test Manufacturer");
        manufacturer.setOrgType(Organization.OrgType.MANUFACTURER);

        Product product = new Product();
        product.setId("prod-1");
        product.setSku("SKU-123");
        product.setName("Test Product");

        Batch batch = new Batch();
        batch.setId("batch-1");
        batch.setProduct(product);
        batch.setBatchNumber("BATCH-001");
        batch.setStatus(BatchStatus.CREATED);
        batch.setManufacturer(manufacturer);
        batch.setCreatedAt(Instant.parse("2024-01-01T10:00:00Z"));
        batch.setUpdatedAt(Instant.parse("2024-01-02T10:00:00Z"));

        BatchResponse dto = batchMapper.toDto(batch);
        assertNotNull(dto);
        assertEquals("batch-1", dto.id());
        assertEquals("prod-1", dto.productId());
        assertEquals("Test Product", dto.productName());
        assertEquals(BatchStatus.CREATED, dto.status());
        assertEquals("org-1", dto.manufacturerId());
        assertEquals(Instant.parse("2024-01-01T10:00:00Z"), dto.createdAt());
        assertEquals(Instant.parse("2024-01-02T10:00:00Z"), dto.updatedAt());
    }

    @Test
    @DisplayName("TransactionMapper converts entity to DTO")
    void testTransactionMapper() {
        Organization manufacturer = new Organization();
        manufacturer.setId("org-1");
        manufacturer.setName("Test Manufacturer");
        manufacturer.setOrgType(Organization.OrgType.MANUFACTURER);

        Product product = new Product();
        product.setId("prod-1");
        product.setSku("SKU-123");
        product.setName("Test Product");

        Batch batch = new Batch();
        batch.setId("batch-1");
        batch.setProduct(product);
        batch.setBatchNumber("BATCH-001");
        batch.setStatus(BatchStatus.CREATED);
        batch.setManufacturer(manufacturer);

        MovementTransaction tx = new MovementTransaction();
        tx.setId("tx-1");
        tx.setBatch(batch);
        tx.setEventType(MovementTransaction.EventType.MANUFACTURED);
        tx.setFromOrgId("org-1");
        tx.setToOrgId("org-2");
        tx.setSignatureHash("aaaabbbbccccddddeeeeffff000011112222333344445555666677778888");
        tx.setPreviousHash("bbbbccccddddeeeeffff000011112222333344445555666677778888aaaa");
        tx.setEventTimestamp(Instant.parse("2024-01-01T12:00:00Z"));
        tx.setCreatedAt(Instant.parse("2024-01-01T10:00:00Z"));

        MovementResponse dto = transactionMapper.toDto(tx);
        assertNotNull(dto);
        assertEquals("tx-1", dto.id());
        assertEquals(MovementTransaction.EventType.MANUFACTURED, dto.eventType());
        assertEquals(Instant.parse("2024-01-01T12:00:00Z"), dto.timestamp());
        assertEquals("org-1", dto.fromOrgId());
        assertEquals("org-2", dto.toOrgId());
        assertEquals("batch-1", dto.batchId());
        assertEquals("aaaabbbbccccddddeeeeffff000011112222333344445555666677778888", dto.signatureHash());
        assertEquals("bbbbccccddddeeeeffff000011112222333344445555666677778888aaaa", dto.previousHash());
    }
}

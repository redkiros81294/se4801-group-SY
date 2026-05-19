package com.chaintrack.repository;

import com.chaintrack.model.Organization;
import com.chaintrack.model.Organization.OrgType;
import com.chaintrack.model.Product;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Repository tests for {@link ProductRepository}.
 *
 * Uses @DataJpaTest to slice only the JPA layer.
 * Flyway is excluded (@see below) so Hibernate auto-creates the schema via
 * ddl-auto=create-drop (active in the test profile).
 *
 * Schema handles
 *    by the Hibernate DDL auto-generation — not by Flyway SQL scripts.
 *
 * Spec usage demonstrates JpaSpecificationExecutor is wired correctly.
 */
@DataJpaTest(excludeAutoConfiguration = org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration.class)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
class ProductRepositoryTest {

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private ProductRepository productRepository;

    private Organization manufacturer;

    @BeforeEach
    void setUp() {
        manufacturer = Organization.builder()
            .name("Test Pharma Ltd.")
            .orgType(OrgType.MANUFACTURER)
            .build();
        entityManager.persist(manufacturer);
        entityManager.flush();
    }

    private Product persistSample(String sku, String name, String category) {
        Product p = Product.builder()
            .sku(sku)
            .name(name)
            .category(category)
            .createdBy(UUID.fromString("00000000-0000-0000-0000-000000000001"))
            .manufacturer(manufacturer)
            .build();
        entityManager.persist(p);
        entityManager.flush();
        return productRepository.findById(p.getId()).orElseThrow();
    }

    @Test
    @DisplayName("findBySku — should return product when SKU exists")
    void findBySku_shouldReturnProduct_whenSkuExists() {
        // Arrange
        persistSample("SKU-001", "Paracetamol 500mg", "Medicine");

        // Act
        Product found = productRepository.findBySku("SKU-001");

        // Assert
        assertThat(found).isNotNull();
        assertThat(found.getSku()).isEqualTo("SKU-001");
        assertThat(found.getName()).isEqualTo("Paracetamol 500mg");
    }

    @Test
    @DisplayName("findBySku — should return null when SKU not found")
    void findBySku_shouldReturnNull_whenSkuNotFound() {
        // Act
        Product found = productRepository.findBySku("DOES-NOT-EXIST");

        // Assert
        assertThat(found).isNull();
    }

    @Test
    @DisplayName("findAll(Specification) — should apply name predicate and return subset")
    void findAll_withSpecification_shouldReturnMatchingRows() {
        // Arrange
        persistSample("SKU-A", "Aspirin 100mg", "Medicine");
        persistSample("SKU-B", "Ibuprofen 200mg", "Medicine");

        // Act — Specification matching name containing "aspirin" (case-insensitive)
        Specification<Product> spec = (root, query, cb) ->
            cb.like(cb.lower(root.get("name")), "%aspirin%");

        var results = productRepository.findAll(spec);

        // Assert
        assertThat(results).hasSize(1);
        assertThat(results.get(0).getSku()).isEqualTo("SKU-A");
    }

    @Test
    @DisplayName("save — should assign ID and timestamps on persist")
    void save_shouldAssignIdAndTimestamps() {
        // Arrange
        Product p = Product.builder()
            .sku("SKU-GEN")
            .name("Generated Product")
            .createdBy(UUID.fromString("00000000-0000-0000-0000-000000000001"))
            .manufacturer(manufacturer)
            .build();

        // Act
        Product saved = productRepository.save(p);
        entityManager.flush();
        Product refreshed = productRepository.findById(saved.getId()).orElse(null);

        // Assert
        assertThat(refreshed).isNotNull();
        assertThat(refreshed.getId()).isNotBlank();
        assertThat(refreshed.getCreatedAt()).isNotNull();
        assertThat(refreshed.getSku()).isEqualTo("SKU-GEN");
    }

    @Test
    @DisplayName("JpaSpecificationExecutor — findBySku via Specification returns correct row")
    void findBySkuViaSpecification_returnsMatches() {
        // Arrange — two records that only differ by SKU, same name
        persistSample("SKU-X", "Shared Name", "Category1");
        persistSample("SKU-Y", "Shared Name", "Category2");

        // Act — Specification targeting SKU = 'SKU-X'
        Specification<Product> skuX = (root, query, cb) ->
            cb.equal(root.get("sku"), "SKU-X");

        var results = productRepository.findAll(skuX);

        // Assert
        assertThat(results).hasSize(1);
        assertThat(results.get(0).getCategory()).isEqualTo("Category1");
    }
}

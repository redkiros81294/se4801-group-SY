package com.chaintrack.service;

import com.chaintrack.dto.request.CreateProductRequest;
import com.chaintrack.dto.request.UpdateProductRequest;
import com.chaintrack.dto.response.ProductResponse;
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
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Service-level tests for {@link ProductService}.
 * Uses @DataJpaTest (JPA layer only) + @Import to wire the service bean.
 * Flyway excluded so Hibernate DDL-auto=create-drop handles schema.
 */
@DataJpaTest(excludeAutoConfiguration = org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration.class)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@Import(ProductService.class)
class ProductServiceTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private ProductService productService;

    @Autowired
    private EntityManager em;

    private Organization manufacturerOrg;

    @BeforeEach
    void setUp() {
        manufacturerOrg = Organization.builder()
            .name("Test Pharma Ltd.")
            .orgType(OrgType.MANUFACTURER)
            .build();
        entityManager.persistAndFlush(manufacturerOrg);
    }

    /**
     * Persists a Product entity and returns it as a ProductResponse via getBySku.
     * Skips the service create path — arranges data directly.
     */
    private ProductResponse persist(String sku, String name, String category) {
        Product p = Product.builder()
            .sku(sku)
            .name(name)
            .category(category)
            .manufacturer(manufacturerOrg)
            .createdBy(UUID.fromString("00000000-0000-0000-0000-000000000001"))
            .build();
        entityManager.persistAndFlush(p);
        return productService.getBySku(sku);
    }

    // ── getBySku ────────────────────────────────────────────────────────

    @Test
    @DisplayName("getBySku — returns ProductResponse when SKU exists")
    void getBySku_returnsResponse_whenSkuExists() {
        ProductResponse resp = persist("SKU-EXISTS", "Aspirin", "Medicine");

        assertThat(resp.sku()).isEqualTo("SKU-EXISTS");
        assertThat(resp.name()).isEqualTo("Aspirin");
        assertThat(resp.id()).isNotBlank();
    }

    @Test
    @DisplayName("getBySku — throws ResourceNotFoundException for unknown SKU")
    void getBySku_throws_whenNotFound() {
        assertThatThrownBy(() -> productService.getBySku("DOES-NOT-EXIST"))
            .isInstanceOf(com.chaintrack.exception.ResourceNotFoundException.class)
            .hasMessageContaining("sku");
    }

    // ── getProductById ──────────────────────────────────────────────────

    @Test
    @DisplayName("getProductById — returns response when id exists")
    void getProductById_returnsResponse_whenExists() {
        ProductResponse resp = persist("SKU-BY-ID", "Paracetamol", "Medicine");

        ProductResponse found = productService.getProductById(resp.id());

        assertThat(found.id()).isEqualTo(resp.id());
        assertThat(found.sku()).isEqualTo("SKU-BY-ID");
    }

    @Test
    @DisplayName("getProductById — throws ResourceNotFoundException for missing id")
    void getProductById_throws_whenNotFound() {
        assertThatThrownBy(() ->
            productService.getProductById("00000000-0000-0000-0000-000000000001"))
            .isInstanceOf(com.chaintrack.exception.ResourceNotFoundException.class)
            .hasMessageContaining("id");
    }

    // ── listProducts ────────────────────────────────────────────────────

    @Test
    @DisplayName("listProducts — paginates correctly, totalElements matches persisted rows")
    void listProducts_paginatesCorrectly() {
        persist("SKU-P1", "Prod-1", "Cat-1");
        persist("SKU-P2", "Prod-2", "Cat-2");
        persist("SKU-P3", "Prod-3", "Cat-3");

        Page<ProductResponse> page = productService.listProducts(PageRequest.ofSize(2));

        assertThat(page.getTotalElements()).isEqualTo(3);
        assertThat(page.getContent()).hasSize(2);
        assertThat(page.hasNext()).isTrue();
    }

    @Test
    @DisplayName("listProducts — page 2 yields last remaining row, page 3 is empty")
    void listProducts_secondPage_lastRowThirdPageEmpty() {
        persist("SKU-1", "Prod-1", "Cat-1");
        persist("SKU-2", "Prod-2", "Cat-2");
        persist("SKU-3", "Prod-3", "Cat-3");

        Page<ProductResponse> page1 = productService.listProducts(PageRequest.of(0, 2));
        assertThat(page1.getContent()).hasSize(2);

        Page<ProductResponse> page2 = productService.listProducts(PageRequest.of(1, 2));
        assertThat(page2.getContent()).hasSize(1);

        Page<ProductResponse> page3 = productService.listProducts(PageRequest.of(2, 2));
        assertThat(page3.getContent()).isEmpty();
    }

    // ── searchProducts ──────────────────────────────────────────────────

    @Test
    @DisplayName("searchProducts — name Specification returns matching subset")
    void searchProducts_nameSpec_returnsMatchingSubset() {
        persist("SKU-ASP",  "Aspirin 100mg", "Medicine");
        persist("SKU-IBU",  "Ibuprofen 200mg", "Medicine");

        Specification<Product> nameSpec = (root, query, cb) ->
            cb.like(cb.lower(root.get("name")), "%aspirin%");

        Page<ProductResponse> page = productService.searchProducts(nameSpec, PageRequest.ofSize(10));

        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getContent().get(0).sku()).isEqualTo("SKU-ASP");
    }

    @Test
    @DisplayName("searchProducts — Specification with no match returns empty page")
    void searchProducts_noMatch_returnsEmptyPage() {
        persist("SKU-X", "Aspirin", "Medicine");

        Specification<Product> noneSpec = (root, query, cb) ->
            cb.like(root.get("sku"), "%NOMATCH%");

        Page<ProductResponse> page = productService.searchProducts(noneSpec, PageRequest.ofSize(10));

        assertThat(page.getContent()).isEmpty();
    }

    @Test
    @DisplayName("searchProducts — category Specification returns correct category")
    void searchProducts_categorySpec_filtersByCategory() {
        persist("SKU-A", "Product A", "Medicine");
        persist("SKU-B", "Product B", "Supplements");

        Specification<Product> medSpec = (root, query, cb) ->
            cb.equal(root.get("category"), "Medicine");

        Page<ProductResponse> page = productService.searchProducts(medSpec, PageRequest.ofSize(10));

        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getContent().get(0).category()).isEqualTo("Medicine");
    }

    // ── createProduct ───────────────────────────────────────────────────

    @Test
    @DisplayName("createProduct — persists and returns DTO with non-null id/sku/name")
    void createProduct_persistsAndReturnsDto() {
        CreateProductRequest req = new CreateProductRequest(
            "SKU-NEW", "New Product", "Category", "Desc",
            manufacturerOrg.getId().toString());

        ProductResponse created = productService.createProduct(req, manufacturerOrg);

        assertThat(created.id()).isNotBlank();
        assertThat(created.sku()).isEqualTo("SKU-NEW");
        assertThat(created.name()).isEqualTo("New Product");
    }

    @Test
    @DisplayName("createProduct — throws DuplicateSkuException when SKU is already taken")
    void createProduct_throwsDuplicateSku_whenSkuTaken() {
        persist("SKU-TAKEN", "Existing Product", "Cat");

        CreateProductRequest req = new CreateProductRequest(
            "SKU-TAKEN", "Duplicate", null, null,
            manufacturerOrg.getId().toString());

        assertThatThrownBy(() -> productService.createProduct(req, manufacturerOrg))
            .isInstanceOf(com.chaintrack.exception.DuplicateSkuException.class)
            .hasMessageContaining("SKU-TAKEN");
    }

    @Test
    @DisplayName("createProduct — must persist product and retrieve it by SKU afterwards")
    void createProduct_retrievesBySkuAfterPersist() {
        CreateProductRequest req = new CreateProductRequest(
            "SKU-RTRV", "Retrievable", "Cat", null,
            manufacturerOrg.getId().toString());

        productService.createProduct(req, manufacturerOrg);

        ProductResponse fetched = productService.getBySku("SKU-RTRV");
        assertThat(fetched.sku()).isEqualTo("SKU-RTRV");
        assertThat(fetched.name()).isEqualTo("Retrievable");
    }

    // ── updateProduct ───────────────────────────────────────────────────

    @Test
    @DisplayName("updateProduct — updates name and category, leaves other fields intact")
    void updateProduct_appliesChangesAndReturnsDto() {
        Product original = Product.builder()
            .sku("SKU-UPD")
            .name("Old Name")
            .category("Old Cat")
            .manufacturer(manufacturerOrg)
            .createdBy(UUID.fromString("00000000-0000-0000-0000-000000000001"))
            .build();
        entityManager.persistAndFlush(original);

        UpdateProductRequest req = new UpdateProductRequest(
            original.getId().toString(), "New Name", "New Cat", null, null, null, null);

        ProductResponse updated = productService.updateProduct(
            original.getId().toString(), req, manufacturerOrg.getId().toString());

        assertThat(updated.name()).isEqualTo("New Name");
        assertThat(updated.category()).isEqualTo("New Cat");
        assertThat(updated.sku()).isEqualTo("SKU-UPD");
    }

    @Test
    @DisplayName("updateProduct — throws ResourceNotFoundException when product id is missing")
    void updateProduct_throwsNotFound_whenProductMissing() {
        UpdateProductRequest req = new UpdateProductRequest(
            "00000000-0000-0000-0000-000000000000", "Name", null, null, null, null, null);

        assertThatThrownBy(() ->
            productService.updateProduct(
                "00000000-0000-0000-0000-000000000000", req,
                manufacturerOrg.getId().toString()))
            .isInstanceOf(com.chaintrack.exception.ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("updateProduct — throws AccessDeniedException when caller does not own product")
    void updateProduct_throwsAccessDenied_whenCallerNotOwner() {
        // Seed a product owned by a DIFFERENT org
        Organization otherOrg = Organization.builder()
            .name("Other Pharma Ltd.")
            .orgType(OrgType.MANUFACTURER)
            .build();
        entityManager.persistAndFlush(otherOrg);

        Product otherProduct = Product.builder()
            .sku("SKU-OTHER-ORG")
            .name("Other's Product")
            .manufacturer(otherOrg)
            .createdBy(UUID.fromString("00000000-0000-0000-0000-000000000002"))
            .build();
        entityManager.persistAndFlush(otherProduct);

        UpdateProductRequest req = new UpdateProductRequest(
            otherProduct.getId().toString(), "Hacked Name", null, null, null, null, null);

        assertThatThrownBy(() ->
            productService.updateProduct(
                otherProduct.getId().toString(), req,
                manufacturerOrg.getId().toString()))
            .isInstanceOf(com.chaintrack.exception.AccessDeniedException.class);
    }

    @Test
    @DisplayName("updateProduct — throws DuplicateSkuException when new SKU already belongs to another product")
    void updateProduct_throwsDuplicateSku_whenTargetSkuTaken() {
        Product p1 = Product.builder()
            .sku("SKU-ALPHA")
            .name("Alpha")
            .manufacturer(manufacturerOrg)
            .createdBy(UUID.fromString("00000000-0000-0000-0000-000000000001"))
            .build();
        entityManager.persistAndFlush(p1);

        Product p2 = Product.builder()
            .sku("SKU-BETA")
            .name("Beta")
            .manufacturer(manufacturerOrg)
            .createdBy(UUID.fromString("00000000-0000-0000-0000-000000000002"))
            .build();
        entityManager.persistAndFlush(p2);

        UpdateProductRequest req = new UpdateProductRequest(
            p1.getId().toString(), "Alpha Renamed", null, null, null, null, "SKU-BETA");

        assertThatThrownBy(() ->
            productService.updateProduct(p1.getId().toString(), req, manufacturerOrg.getId().toString()))
            .isInstanceOf(com.chaintrack.exception.DuplicateSkuException.class);
    }
}

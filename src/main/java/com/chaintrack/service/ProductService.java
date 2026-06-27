package com.chaintrack.service;

import com.chaintrack.dto.request.CreateProductRequest;
import com.chaintrack.dto.request.UpdateProductRequest;
import com.chaintrack.dto.response.ProductResponse;
import com.chaintrack.model.Product;
import com.chaintrack.model.Organization;
import com.chaintrack.repository.ProductRepository;
import com.chaintrack.exception.ResourceNotFoundException;
import com.chaintrack.exception.AccessDeniedException;
import com.chaintrack.exception.DuplicateSkuException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static org.apache.commons.lang3.StringUtils.isBlank;

/**
 * Service for managing products in the supply chain.
 * <p>
 * All read methods are {@code @Transactional(readOnly = true)} at the class level.
 * Write methods inject a new {@code @Transactional} boundary.
 * </p>
 *
 * <p><strong>SKU uniqueness</strong> is enforced at the database level (V3 UNIQUE constraint).
 * A {@link DuplicateSkuException} is thrown before hitting the DB if the caller calls
 * {@link #createProduct} with a SKU that is already stored.</p>
 *
 * <p><strong>Manufacturer org check</strong>: calls that require a MANUFACTURER owner
 * accept a {@code manufacturerId} so the controller can supply the caller's org id without
 * trusting the incoming body.</p>
 */
@Service
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    // ── reads ────────────────────────────────────────────────────────────

    /**
     * Returns a paginated list of all products.
     */
    @Transactional(readOnly = true)
    public Page<ProductResponse> listProducts(Pageable pageable) {
        return productRepository.findAll(pageable)
            .map(ProductResponse::fromEntity);
    }

    /**
     * Searches products using a JPA {@link Specification} built by the caller.
     * The controller layer composes the predicate from search parameters
     * (name keyword, category, SKU prefix, fromDate).
     *
     * @param spec the composed Specification (never null)
     * @param pageable pagination (max size enforced at controller = 100)
     * @return page of matching ProductResponse
     */
    @Transactional(readOnly = true)
    public Page<ProductResponse> searchProducts(Specification<Product> spec, Pageable pageable) {
        return productRepository.findAll(spec, pageable)
            .map(ProductResponse::fromEntity);
    }

    /**
     * Returns a single product by its UUID string id.
     *
     * @param id the product id
     * @return ProductResponse
     * @throws ResourceNotFoundException if not found
     */
    @Transactional(readOnly = true)
    public ProductResponse getProductById(String id) {
        Product product = productRepository.findById(java.util.UUID.fromString(id))
            .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        return ProductResponse.fromEntity(product);
    }

    /**
     * Returns a single product by SKU.
     *
     * @param sku the product SKU
     * @return ProductResponse
     * @throws ResourceNotFoundException if not found
     */
    @Transactional(readOnly = true)
    public ProductResponse getBySku(String sku) {
        Product product = productRepository.findBySku(sku);
        if (product == null) {
            throw new ResourceNotFoundException("Product", "sku", sku);
        }
        return ProductResponse.fromEntity(product);
    }

    // ── writes ───────────────────────────────────────────────────────────

    /**
     * Creates a new product.
     *
     * <p>Caller must be a MANUFACTURER org — enforced by the controller via
     * {@code @PreAuthorize("hasRole('MANUFACTURER')")}.</p>
     *
     * @param request            the validated create payload
     * @param manufacturerOrg    the authenticated caller's organization (ownership anchor)
     * @return the created ProductResponse
     * @throws DuplicateSkuException if the SKU already exists
     */
    @Transactional
    public ProductResponse createProduct(CreateProductRequest request, Organization manufacturerOrg) {
        validateCreateRequest(request);

        if (productRepository.findBySku(request.sku()) != null) {
            throw new DuplicateSkuException(request.sku());
        }

        Product product = Product.builder()
            .sku(request.sku())
            .name(request.name())
            .category(request.category())
            .description(request.description())
            .manufacturer(manufacturerOrg)
            .createdBy(manufacturerOrg.getId())
            .build();
        Product saved = productRepository.save(product);
        return ProductResponse.fromEntity(saved);
    }

    /**
     * Updates an existing product. Only the owning MANUFACTURER may update.
     *
     * @param productId   the product UUID string
     * @param request     the validated update payload
     * @param callerOrgId UUID string of the authenticated caller's org (BOLA check)
     * @return updated ProductResponse
     * @throws ResourceNotFoundException if product does not exist
     * @throws AccessDeniedException     if caller org does not own the product
     * @throws DuplicateSkuException     if the new SKU collides with an existing product
     */
    @Transactional
    public ProductResponse updateProduct(String productId, UpdateProductRequest request, String callerOrgId) {
        if (isBlank(productId)) {
            throw new IllegalArgumentException("productId must not be blank");
        }

        Product product = productRepository.findById(java.util.UUID.fromString(productId))
            .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        // BOLA: only the owning org may update
        if (product.getManufacturer() == null
            || !product.getManufacturer().getId().toString().equals(callerOrgId)) {
            throw new AccessDeniedException(
                "Organization '" + callerOrgId + "' does not own product '" + productId + "'");
        }

        // SKU uniqueness check (skip if SKU not changing)
        if (request.sku() != null && !request.sku().isBlank()
            && !request.sku().equals(product.getSku())) {
            Product existing = productRepository.findBySku(request.sku());
            if (existing != null && !existing.getId().equals(productId)) {
                throw new DuplicateSkuException(request.sku());
            }
            product.setSku(request.sku());
        }

        if (request.name() != null && !request.name().isBlank()) {
            product.setName(request.name());
        }
        if (request.category() != null) {
            product.setCategory(request.category());
        }
        if (request.description() != null) {
            product.setDescription(request.description());
        }

        Product saved = productRepository.save(product);
        return ProductResponse.fromEntity(saved);
    }

    // ── helpers ──────────────────────────────────────────────────────────

    private static void validateCreateRequest(CreateProductRequest request) {
        if (isBlank(request.sku())) {
            throw new IllegalArgumentException("sku must not be blank");
        }
        if (isBlank(request.name())) {
            throw new IllegalArgumentException("name must not be blank");
        }
    }
}

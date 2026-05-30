package com.chaintrack.controller;

import com.chaintrack.dto.request.CreateProductRequest;
import com.chaintrack.dto.request.UpdateProductRequest;
import com.chaintrack.dto.response.ProductResponse;
import com.chaintrack.model.Organization;
import com.chaintrack.model.Product;
import com.chaintrack.repository.OrganizationRepository;
import com.chaintrack.security.JwtUtils;
import com.chaintrack.service.ProductService;
import com.chaintrack.exception.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

@RestController
@RequestMapping("/api/products")
@Tag(name = "Products", description = "Product management APIs")
public class ProductController {

    private final ProductService productService;
    private final JwtUtils jwtUtils;
    private final OrganizationRepository organizationRepository;

    public ProductController(ProductService productService, JwtUtils jwtUtils, OrganizationRepository organizationRepository) {
        this.productService = productService;
        this.jwtUtils = jwtUtils;
        this.organizationRepository = organizationRepository;
    }

    @GetMapping
    @Operation(summary = "List all products", description = "Returns paginated list of products (public)")
    @ApiResponse(responseCode = "200", description = "Successful retrieval")
    public Page<ProductResponse> listProducts(
            @PageableDefault(size = 20) Pageable pageable) {
        return productService.listProducts(pageable);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get product by ID", description = "Returns a single product (public)")
    @ApiResponse(responseCode = "200", description = "Product found")
    @ApiResponse(responseCode = "404", description = "Product not found", content = @Content(schema = @Schema(implementation = com.chaintrack.exception.ErrorResponse.class)))
    public ProductResponse getProductById(@PathVariable String id) {
        return productService.getProductById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('MANUFACTURER')")
    @Operation(summary = "Create product", description = "Creates a new product (MANUFACTURER only)")
    @ApiResponse(responseCode = "201", description = "Product created successfully")
    @ApiResponse(responseCode = "400", description = "Invalid request data", content = @Content(schema = @Schema(implementation = com.chaintrack.exception.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden - MANUFACTURER role required")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse createProduct(@Valid @RequestBody CreateProductRequest request,
                                         @RequestHeader("Authorization") String authHeader) {
        String token = authHeader != null && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "";
        String orgId = jwtUtils.extractOrgId(token);
        final String finalOrgId = (orgId != null) ? orgId : "";
        Organization org = organizationRepository.findById(finalOrgId)
            .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", finalOrgId));
        return productService.createProduct(request, org);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('MANUFACTURER')")
    @Operation(summary = "Update product", description = "Updates product details (MANUFACTURER, own products only)")
    @ApiResponse(responseCode = "200", description = "Product updated successfully")
    @ApiResponse(responseCode = "400", description = "Invalid request data", content = @Content(schema = @Schema(implementation = com.chaintrack.exception.ErrorResponse.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden - MANUFACTURER role required or not own product")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @ApiResponse(responseCode = "404", description = "Product not found", content = @Content(schema = @Schema(implementation = com.chaintrack.exception.ErrorResponse.class)))
    public ProductResponse updateProduct(@PathVariable String id,
                                         @Valid @RequestBody UpdateProductRequest request,
                                         @RequestHeader("Authorization") String authHeader) {
        String token = authHeader != null && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "";
        String callerOrgId = jwtUtils.extractOrgId(token);
        final String finalCallerOrgId = (callerOrgId != null) ? callerOrgId : "";
        return productService.updateProduct(id, request, finalCallerOrgId);
    }

    @GetMapping("/search")
    @Operation(summary = "Search products", description = "Multi-parameter search for products (public)")
    @ApiResponse(responseCode = "200", description = "Successful search")
    public Page<ProductResponse> searchProducts(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String sku,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @PageableDefault(size = 20) Pageable pageable) {
        if (pageable.getPageSize() > 100) {
            throw new IllegalArgumentException("Page size must not exceed 100");
        }
        Specification<Product> spec = (root, query, cb) -> cb.conjunction();
        if (name != null && !name.isBlank()) {
            String pattern = "%" + name.toLowerCase() + "%";
            spec = spec.and((r, q, c) -> c.like(c.lower(r.get("name")), pattern));
        }
        if (category != null && !category.isBlank()) {
            spec = spec.and((r, q, c) -> c.equal(r.get("category"), category));
        }
        if (sku != null && !sku.isBlank()) {
            String pattern = "%" + sku.toLowerCase() + "%";
            spec = spec.and((r, q, c) -> c.like(c.lower(r.get("sku")), pattern));
        }
        if (fromDate != null) {
            Instant fromInstant = fromDate.atStartOfDay(ZoneId.systemDefault()).toInstant();
            spec = spec.and((r, q, c) -> c.greaterThanOrEqualTo(r.get("createdAt"), fromInstant));
        }
        return productService.searchProducts(spec, pageable);
    }
}

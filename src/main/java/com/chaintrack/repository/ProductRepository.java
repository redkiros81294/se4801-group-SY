import java.util.UUID;
import java.util.UUID;
package com.chaintrack.repository;

import com.chaintrack.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * Repository for {@link Product}.
 * All queries return only records belonging to the caller's authenticated org
 * — org-scoping is enforced in the service layer, never in the repository.
 */
@Repository
public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {
    /**
     * Returns the product with the given SKU, or {@code null} if not found.
     */
    Product findBySku(String sku);
}

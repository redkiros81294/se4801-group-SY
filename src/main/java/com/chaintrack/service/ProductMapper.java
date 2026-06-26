package com.chaintrack.service;

import com.chaintrack.dto.response.ProductResponse;
import com.chaintrack.model.Product;
import org.springframework.stereotype.Component;

@Component
public class ProductMapper {

    public ProductResponse toDto(Product product) {
        if (product == null) {
            return null;
        }
        return new ProductResponse(
            product.getId().toString(),
            product.getSku(),
            product.getName(),
            product.getDescription(),
            product.getCategory(),
            product.getManufacturer() != null ? product.getManufacturer().getId().toString() : null,
            product.getCreatedAt(),
            product.getUpdatedAt()
        );
    }
}

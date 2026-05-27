package com.chaintrack.service;

import com.chaintrack.dto.response.BatchResponse;
import com.chaintrack.model.Batch;
import com.chaintrack.model.Product;
import org.springframework.stereotype.Component;

@Component
public class BatchMapper {

    public BatchResponse toDto(Batch batch) {
        if (batch == null) {
            return null;
        }
        Product product = batch.getProduct();
        return new BatchResponse(
            batch.getId(),
            product != null ? product.getId() : null,
            product != null ? product.getName() : null,
            batch.getStatus(),
            batch.getManufacturer() != null ? batch.getManufacturer().getId() : null,
            batch.getCreatedAt(),
            batch.getUpdatedAt()
        );
    }
}

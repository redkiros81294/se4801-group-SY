package com.chaintrack.repository;

import com.chaintrack.model.Batch;
import com.chaintrack.model.BatchStatus;
import com.chaintrack.model.Organization;
import com.chaintrack.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BatchRepository extends JpaRepository<Batch, UUID> {
    List<Batch> findByProductAndStatus(Product product, BatchStatus status);

    List<Batch> findByManufacturer(Organization organization);

    Page<Batch> findByManufacturer(Organization organization, Pageable pageable);

    long countByStatus(BatchStatus status);

    Page<Batch> findByBatchNumberContainingIgnoreCase(String batchNumber, Pageable pageable);
}

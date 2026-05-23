package com.chaintrack.repository;

import com.chaintrack.model.Batch;
import com.chaintrack.model.BatchStatus;
import com.chaintrack.model.Organization;
import com.chaintrack.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BatchRepository extends JpaRepository<Batch, String> {
    List<Batch> findByProductAndStatus(Product product, BatchStatus status);

    List<Batch> findByManufacturer(Organization manufacturer);

    long countByStatus(BatchStatus status);
}
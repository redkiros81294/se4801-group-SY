package com.chaintrack.repository;

import com.chaintrack.model.Batch;
import com.chaintrack.model.MovementTransaction;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MovementTransactionRepository extends JpaRepository<MovementTransaction, UUID> {
    
    @EntityGraph(attributePaths = "batch")
    List<MovementTransaction> findByBatchOrderByEventTimestampAsc(Batch batch);

    @EntityGraph(attributePaths = "batch")
    Optional<MovementTransaction> findTopByBatchOrderByEventTimestampDesc(Batch batch);
}
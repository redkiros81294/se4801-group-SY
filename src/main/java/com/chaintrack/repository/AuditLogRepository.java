package com.chaintrack.repository;

import com.chaintrack.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    /**
     * The most recent entry — the tail of the hash chain.
     */
    Optional<AuditLog> findTopByOrderByCreatedAtDesc();

    Page<AuditLog> findByActorContainingIgnoreCase(String actor, Pageable pageable);

    Page<AuditLog> findByAction(String action, Pageable pageable);

    Page<AuditLog> findByEntityType(String entityType, Pageable pageable);
}

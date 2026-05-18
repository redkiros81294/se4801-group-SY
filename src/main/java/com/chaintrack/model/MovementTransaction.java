package com.chaintrack.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * Records one supply chain event for a batch.
 * Each transaction stores a SHA-256 signature hash computed from
 *    eventType + timestamp + fromOrgId + toOrgId + previousHash.
 * The previousHash is the signatureHash of the previous transaction
 * (or "GENESIS" for the very first event). This chain is immutable —
 * transactions are never updated or deleted.
 */
@Entity
@Table(name = "movement_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovementTransaction {

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 50)
    private EventType eventType;

    @Column(name = "event_timestamp", nullable = false)
    private Instant eventTimestamp;

    @Column(name = "from_org_id")
    private String fromOrgId;

    @Column(name = "to_org_id")
    private String toOrgId;

    @Column(name = "batch_id", nullable = false)
    private String batchId;

    @Column(name = "signature_hash", nullable = false, length = 64)
    private String signatureHash;

    @Column(name = "previous_hash", nullable = false, length = 64)
    private String previousHash;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public enum EventType {
        MANUFACTURED,
        SHIPPED,
        IN_TRANSIT,
        RECEIVED
    }
}
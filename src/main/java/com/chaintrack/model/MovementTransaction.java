package com.chaintrack.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;
import java.time.Instant;

/**
 * Immutable hash-chained record of one supply chain event for a batch.
 * Each transaction signs SHA-256(eventType + timestamp + fromOrgId + toOrgId + previousHash).
 * The {@code previousHash} is the {@code signatureHash} of the preceding transaction
 * (or {@code "GENESIS"} for the first event).  Transactions are never updated or deleted.
 */
@Entity
@Table(name = "movement_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovementTransaction {

    @Id
    @GeneratedValue(generator = "UUID")
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 50)
    private EventType eventType;

    @Column(name = "event_timestamp", nullable = false)
    private Instant eventTimestamp;

    @Column(name = "from_org_id")
    private String fromOrgId;

    @Column(name = "to_org_id")
    private String toOrgId;

    /**
     * The owning batch for this movement.  Maps to the {@code batch_id} FK column.
     * The owning side of the relationship — JPA manages the FK, not this class.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", nullable = false)
    private Batch batch;

    /**
     * Read-only serialization of the batch ID as a String.
     * Stored at write time via lifecycle callback so the field never drifts from
     * the FK column, while keeping {@link #batch} as the JPA-owning association.
     * Not persisted directly — populated from {@link #batch#getId()} before insert.
     */
    @Transient
    @Column(name = "batch_id", insertable = false, updatable = false)
    private String batchId;

    @Column(name = "signature_hash", nullable = false, length = 64)
    private String signatureHash;

    @Column(name = "previous_hash", nullable = false, length = 64)
    private String previousHash;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Lifecycle hook — populates the transient {@code batchId} before insert
     * so that JSON serializers see a non-null value without persisting it twice.
     */
    @PrePersist
    void prePersist() {
        if (batch != null && batchId == null) {
            this.batchId = batch.getId();
        }
    }

    public enum EventType {
        MANUFACTURED,
        SHIPPED,
        IN_TRANSIT,
        RECEIVED
    }
}

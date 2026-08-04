package com.chaintrack.service;

import com.chaintrack.exception.InvalidEventTransitionException;
import com.chaintrack.exception.ResourceNotFoundException;
import com.chaintrack.model.*;
import com.chaintrack.repository.BatchRepository;
import com.chaintrack.repository.MovementTransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.apache.commons.lang3.StringUtils.isBlank;

@Service
@Transactional(readOnly = true)
public class MovementTransactionServiceImpl implements MovementTransactionService {

    private final MovementTransactionRepository transactionRepository;
    private final BatchRepository batchRepository;
    private final HashService hashService;

    public MovementTransactionServiceImpl(MovementTransactionRepository transactionRepository,
                                          BatchRepository batchRepository,
                                          HashService hashService) {
        this.transactionRepository = transactionRepository;
        this.batchRepository = batchRepository;
        this.hashService = hashService;
    }

    @Override
    @Transactional
    public MovementTransaction recordMovement(CreateMovementRequest request) {
        Batch batch = batchRepository.findById(java.util.UUID.fromString(request.batchId()))
            .orElseThrow(() -> new ResourceNotFoundException("Batch", "id", request.batchId()));

        // Resolve the current event type from the request
        MovementTransaction.EventType currentEventType = MovementTransaction.EventType.valueOf(request.eventType());

        // Get the previous transaction to link the hash chain
        String previousHash;
        MovementTransaction previousTx = transactionRepository
            .findTopByBatchOrderByEventTimestampDesc(batch)
            .orElse(null);

        // Validate event type transitions
        if (previousTx == null) {
            if (currentEventType != MovementTransaction.EventType.MANUFACTURED) {
                throw new InvalidEventTransitionException(
                    "No previous transaction: only MANUFACTURED is allowed as the first event type");
            }
            previousHash = "GENESIS";
        } else {
            MovementTransaction.EventType previousEventType = previousTx.getEventType();
            boolean validTransition = switch (previousEventType) {
                case MANUFACTURED -> currentEventType == MovementTransaction.EventType.SHIPPED;
                case SHIPPED -> currentEventType == MovementTransaction.EventType.IN_TRANSIT;
                case IN_TRANSIT -> currentEventType == MovementTransaction.EventType.RECEIVED;
                default -> false;
            };
            if (!validTransition) {
                throw new InvalidEventTransitionException(previousEventType.name(), currentEventType.name());
            }
            previousHash = previousTx.getSignatureHash();
        }

        /*
         * The signature hash is computed over the timestamp string, and the chain
         * verifier recomputes it from the value read back out of the database.
         * PostgreSQL stores timestamps with microsecond precision, while
         * Instant.now() can carry nanoseconds. If the hash were computed over the
         * nano-precision string, every legitimately recorded movement would fail
         * verification after the DB round-trip (COMPROMISED). Truncate to
         * microseconds first so the stored value is exactly what was hashed.
         */
        Instant timestamp = Instant.now().truncatedTo(ChronoUnit.MICROS);
        String signatureHash = hashService.chainHash(
            request.eventType(),
            timestamp.toString(),
            request.fromOrgId(),
            request.toOrgId(),
            previousHash
        );

        MovementTransaction movement = MovementTransaction.builder()
            .eventType(MovementTransaction.EventType.valueOf(request.eventType()))
            .eventTimestamp(timestamp)
            .fromOrgId(request.fromOrgId())
            .toOrgId(request.toOrgId())
            .batch(batch)
            .signatureHash(signatureHash)
            .previousHash(previousHash)
            .build();

        MovementTransaction saved = transactionRepository.save(movement);

        // Keep the batch status in sync with the supply-chain lifecycle
        BatchStatus nextStatus = switch (saved.getEventType()) {
            case SHIPPED, IN_TRANSIT -> BatchStatus.IN_TRANSIT;
            case RECEIVED -> BatchStatus.DELIVERED;
            case MANUFACTURED -> BatchStatus.CREATED; // already the initial status
        };
        if (batch.getStatus() != nextStatus) {
            batch.setStatus(nextStatus);
            batchRepository.save(batch);
        }

        return saved;
    }

    @Override
    public List<MovementTransaction> getChainForBatch(String batchId) {
        if (isBlank(batchId)) {
            throw new IllegalArgumentException("batchId must not be blank");
        }
        Batch batch = batchRepository.findById(java.util.UUID.fromString(batchId))
            .orElseThrow(() -> new ResourceNotFoundException("Batch", "id", batchId));
        return transactionRepository.findByBatchOrderByEventTimestampAsc(batch);
    }
}

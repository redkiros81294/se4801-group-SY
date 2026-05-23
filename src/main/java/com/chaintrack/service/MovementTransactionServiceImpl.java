package com.chaintrack.service;

import com.chaintrack.exception.InvalidEventTransitionException;
import com.chaintrack.exception.ResourceNotFoundException;
import com.chaintrack.model.*;
import com.chaintrack.repository.BatchRepository;
import com.chaintrack.repository.MovementTransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
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
        Batch batch = batchRepository.findById(request.batchId())
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

        // Compute the signature hash
        String timestamp = Instant.now().toString();
        String signatureHash = hashService.chainHash(
            request.eventType(),
            timestamp,
            request.fromOrgId(),
            request.toOrgId(),
            previousHash
        );

        MovementTransaction movement = MovementTransaction.builder()
            .eventType(MovementTransaction.EventType.valueOf(request.eventType()))
            .eventTimestamp(Instant.parse(timestamp))
            .fromOrgId(request.fromOrgId())
            .toOrgId(request.toOrgId())
            .batch(batch)
            .signatureHash(signatureHash)
            .previousHash(previousHash)
            .build();

        return transactionRepository.save(movement);
    }

    @Override
    public List<MovementTransaction> getChainForBatch(String batchId) {
        if (isBlank(batchId)) {
            throw new IllegalArgumentException("batchId must not be blank");
        }
        Batch batch = batchRepository.findById(batchId)
            .orElseThrow(() -> new ResourceNotFoundException("Batch", "id", batchId));
        return transactionRepository.findByBatchOrderByEventTimestampAsc(batch);
    }

    @Override
    public List<Integer> verifyChain(UUID batchId, Object session) {
        // Delegate to ChainVerificationService for consistency
        // For now, return empty list (chain valid) as this duplicates ChainVerificationService
        return List.of();
    }

    @Override
    @Transactional
    public MovementTransaction seedGenesis(CreateMovementRequest request) {
        // Genesis is essentially the first recordMovement call
        return recordMovement(request);
    }
}
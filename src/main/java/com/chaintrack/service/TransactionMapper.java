package com.chaintrack.service;

import com.chaintrack.dto.response.MovementResponse;
import com.chaintrack.model.MovementTransaction;
import com.chaintrack.model.MovementTransaction.EventType;
import org.springframework.stereotype.Component;

@Component
public class TransactionMapper {

    public MovementResponse toDto(MovementTransaction tx) {
        if (tx == null) {
            return null;
        }
        return new MovementResponse(
            tx.getId(),
            tx.getEventType(),
            tx.getEventTimestamp(),
            tx.getFromOrgId(),
            tx.getToOrgId(),
            tx.getBatch() != null ? tx.getBatch().getId() : tx.getBatchId(),
            tx.getSignatureHash(),
            tx.getPreviousHash()
        );
    }
}

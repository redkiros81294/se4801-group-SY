package com.chaintrack.dto.response;

import com.chaintrack.model.Batch;

import java.time.Instant;
import java.util.UUID;

public record QRCodeResponse(
    String id,
    UUID tokenValue,
    UUID batchId,
    String qrImage,
    Instant createdAt
) {
    public static QRCodeResponse fromEntity(com.chaintrack.model.QRToken qrToken) {
        Batch batch = qrToken.getBatch();
        return new QRCodeResponse(
            qrToken.getId().toString(),
            qrToken.getTokenValue(),
            batch != null ? batch.getId() : null,
            qrToken.getQrImage(),
            qrToken.getCreatedAt()
        );
    }
}

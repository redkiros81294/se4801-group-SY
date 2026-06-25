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
            qrToken.getId(),
            qrToken.getTokenValue(),
            batch != null ? UUID.fromString(batch.getId().toString()) : null,
            qrToken.getQrImage(),
            qrToken.getCreatedAt()
        );
    }
}

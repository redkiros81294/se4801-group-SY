package com.chaintrack.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.EnumMap;
import java.util.Map;

/**
 * Generates QR code images in PNG format, returned as Base64-encoded strings.
 */
@Service
public class QRCodeService {

    private static final int DEFAULT_SIZE = 300;
    private static final String FORMAT = "PNG";

    /**
     * Generates a QR code image for the given content.
     *
     * @param content the text to encode in the QR code (e.g., tokenValue)
     * @return Base64-encoded PNG image data
     * @throws IllegalArgumentException if content is null or empty
     */
    public String generateQRCode(String content) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("QR code content cannot be null or empty");
        }

        try {
            Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
            hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.L);
            hints.put(EncodeHintType.MARGIN, 1);

            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix bitMatrix = writer.encode(content, BarcodeFormat.QR_CODE, DEFAULT_SIZE, DEFAULT_SIZE, hints);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, FORMAT, baos);

            return Base64.getEncoder().encodeToString(baos.toByteArray());
        } catch (WriterException | java.io.IOException e) {
            throw new RuntimeException("Failed to generate QR code: " + e.getMessage(), e);
        }
    }
}
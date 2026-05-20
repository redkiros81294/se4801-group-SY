package com.chaintrack.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class QRCodeServiceTest {

    @InjectMocks
    private QRCodeService qrCodeService;

    @Test
    void generateQRCode_withValidContent_returnsBase64Png() {
        String content = "test-token-123";

        String result = qrCodeService.generateQRCode(content);

        assertNotNull(result);
        assertFalse(result.isBlank());
        byte[] decoded = Base64.getDecoder().decode(result);
        assertTrue(decoded.length > 0);
        assertEquals((byte) 0x89, decoded[0]);
        assertEquals((byte) 0x50, decoded[1]);
        assertEquals((byte) 0x4E, decoded[2]);
        assertEquals((byte) 0x47, decoded[3]);
    }

    @Test
    void generateQRCode_withNullContent_throwsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () -> qrCodeService.generateQRCode(null));
    }

    @Test
    void generateQRCode_withEmptyContent_throwsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () -> qrCodeService.generateQRCode(""));
    }

    @Test
    void generateQRCode_withBlankContent_throwsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () -> qrCodeService.generateQRCode("   "));
    }
}
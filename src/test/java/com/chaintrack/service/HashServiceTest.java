package com.chaintrack.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class HashServiceTest {

    private final HashService hashService = new SHA256HashServiceImpl();

    @Test
    void sha256_knownInput_returnsExpectedHash() {
        String input = "hello";
        String expected = "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824";

        String result = hashService.sha256(input);

        assertEquals(expected, result);
    }

    @Test
    void sha256_emptyString_returnsExpectedHash() {
        String input = "";
        String expected = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

        String result = hashService.sha256(input);

        assertEquals(expected, result);
    }

    @Test
    void sha256_produces64CharHex() {
        String result = hashService.sha256("test-data");

        assertEquals(64, result.length());
        assertTrue(result.matches("[0-9a-f]+"));
    }

    @Test
    void chainHash_allParametersProvided_returnsValidHash() {
        String result = hashService.chainHash("MANUFACTURE", "2024-01-15T10:30:00Z", "org-1", "org-2", "prev-hash");

        assertEquals(64, result.length());
        assertTrue(result.matches("[0-9a-f]+"));
    }

    @Test
    void chainHash_nullPreviousHash_replacesWithEmpty() {
        String resultWithNull = hashService.chainHash("SHIP", "2024-01-15T10:30:00Z", "org-1", "org-2", null);
        String resultWithEmpty = hashService.chainHash("SHIP", "2024-01-15T10:30:00Z", "org-1", "org-2", "");

        assertEquals(resultWithEmpty, resultWithNull);
    }
}
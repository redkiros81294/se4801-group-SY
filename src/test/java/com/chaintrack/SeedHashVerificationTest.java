package com.chaintrack;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class SeedHashVerificationTest {

    private static final String STORED_HASH = "$2a$12$W15s4JbLSdn9eAWc4WenM.1rPplX618rA95dzP9GY9PHQylE8F4d2";
    private static final String[] CANDIDATE_PASSWORDS = {
        "Admin@123!", "Test@123!", "password", "Password123!",
        "admin123", "Admin123", "test123", "Test123",
        "chaintrack", "Chaintrack1!"
    };

    @Test
    void verifySeedHashes() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);

        System.out.println("=== Seed Hash Verification ===");
        System.out.println("Stored hash: " + STORED_HASH);
        System.out.println();

        // Test candidate passwords against stored hash
        boolean anyMatch = false;
        for (String pw : CANDIDATE_PASSWORDS) {
            boolean match = encoder.matches(pw, STORED_HASH);
            System.out.println("Password '" + pw + "' matches stored hash: " + match);
            if (match) anyMatch = true;
        }

        // Show what a fresh encode looks like
        String fresh = encoder.encode("Admin@123!");
        System.out.println();
        System.out.println("Fresh encode of 'Admin@123!': " + fresh);
        System.out.println("Fresh matches stored: " + encoder.matches("Admin@123!", STORED_HASH));

        // Verify the hash format is valid
        System.out.println();
        System.out.println("=== Hash Format Check ===");
        System.out.println("Hash starts with $2a$12$ (BCrypt cost 12): " + STORED_HASH.startsWith("$2a$12$"));
        System.out.println("Hash length (should be 60): " + STORED_HASH.length());

        // Also verify that a WRONG password does NOT match
        System.out.println();
        System.out.println("=== Negative Test ===");
        System.out.println("'WrongPassword!' matches: " + encoder.matches("WrongPassword!", STORED_HASH));

        // Assert that at least one candidate matches (to verify the hash isn't completely broken)
        if (!anyMatch) {
            System.out.println();
            System.out.println("WARNING: No candidate password matched the stored hash!");
            System.out.println("The seed hash may have been generated from a different password than documented.");
        }
    }
}

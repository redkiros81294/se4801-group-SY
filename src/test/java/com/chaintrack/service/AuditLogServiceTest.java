package com.chaintrack.service;

import com.chaintrack.model.AuditLog;
import com.chaintrack.repository.AuditLogRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditLogServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private AuditLogService auditLogService;

    @Test
    @DisplayName("record — chains the new entry to the previous hash")
    void record_chainsToPreviousHash() {
        AuditLog previous = AuditLog.builder()
            .actor("admin@test.com")
            .action("CREATE")
            .entityType("USER")
            .entityId("11111111-1111-1111-1111-111111111111")
            .summary("test summary")
            .ipAddress("127.0.0.1")
            .requestId("req-1")
            .previousHash("prev-hash")
            .integrityHash("hash-prev")
            .build();
        when(auditLogRepository.findTopByOrderByCreatedAtDesc()).thenReturn(Optional.of(previous));
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(inv -> inv.getArgument(0));

        AuditLog saved = auditLogService.record(
            "admin@test.com", "CREATE", "USER",
            "22222222-2222-2222-2222-222222222222",
            "create user", "127.0.0.1", "req-1");

        assertThat(saved.getPreviousHash()).isEqualTo("hash-prev");
        assertThat(saved.getIntegrityHash()).isNotBlank();
        assertThat(saved.getIntegrityHash()).hasSize(64); // SHA-256 hex
        // Each entry must differ because its content differs
        assertThat(saved.getIntegrityHash()).isNotEqualTo("hash-prev");
    }

    @Test
    @DisplayName("record — first entry uses GENESIS as previous hash")
    void record_firstEntryUsesGenesis() {
        when(auditLogRepository.findTopByOrderByCreatedAtDesc()).thenReturn(Optional.empty());
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(inv -> inv.getArgument(0));

        AuditLog saved = auditLogService.record(
            "system", "LOGIN", "AUTH", null, "login", null, null);

        assertThat(saved.getPreviousHash()).isEqualTo(AuditLogService.GENESIS);
    }

    @Test
    @DisplayName("verifyIntegrity — detects a tampered entry")
    void verifyIntegrity_detectsTampering() {
        // Build a real chain through the service, then tamper with the second entry
        when(auditLogRepository.findTopByOrderByCreatedAtDesc())
            .thenReturn(Optional.empty())
            .thenAnswer(inv -> Optional.of(entryWithHash(AuditLogService.GENESIS, "h1")));
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(inv -> inv.getArgument(0));

        AuditLog first = auditLogService.record("a@test.com", "CREATE", "USER", "u1", "s1", null, null);
        AuditLog second = auditLogService.record("a@test.com", "UPDATE", "USER", "u1", "s2", null, null);

        // Simulate tampering: content changed but the hash was NOT recomputed
        second.setSummary("tampered summary");

        when(auditLogRepository.findAll(any(org.springframework.data.domain.Sort.class)))
            .thenReturn(List.of(first, second));

        Map<String, Object> result = auditLogService.verifyIntegrity();

        assertThat(result.get("intact")).isEqualTo(false);
        assertThat(result.get("firstBrokenIndex")).isEqualTo(1);
        assertThat(result.get("entries")).isEqualTo(2);
    }

    @Test
    @DisplayName("verifyIntegrity — intact chain reports intact=true")
    void verifyIntegrity_intactChain() {
        // Build a small intact chain by actually recording through the service.
        java.util.concurrent.atomic.AtomicReference<AuditLog> latest = new java.util.concurrent.atomic.AtomicReference<>();
        when(auditLogRepository.findTopByOrderByCreatedAtDesc())
            .thenAnswer(inv -> Optional.ofNullable(latest.get()));
        when(auditLogRepository.save(any(AuditLog.class)))
            .thenAnswer(inv -> {
                AuditLog saved = inv.getArgument(0);
                latest.set(saved);
                return saved;
            });

        AuditLog first = auditLogService.record("a@test.com", "CREATE", "USER", "u1", null, null, null);
        AuditLog second = auditLogService.record("a@test.com", "UPDATE", "USER", "u1", null, null, null);

        when(auditLogRepository.findAll(any(org.springframework.data.domain.Sort.class)))
            .thenReturn(List.of(first, second));

        Map<String, Object> result = auditLogService.verifyIntegrity();

        assertThat(result.get("intact")).isEqualTo(true);
        assertThat(result.get("entries")).isEqualTo(2);
    }

    private static AuditLog entryWithHash(String previousHash, String integrityHash) {
        AuditLog e = new AuditLog();
        e.setPreviousHash(previousHash);
        e.setIntegrityHash(integrityHash);
        return e;
    }
}

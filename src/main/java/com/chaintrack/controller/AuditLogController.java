package com.chaintrack.controller;

import com.chaintrack.dto.response.AuditLogResponse;
import com.chaintrack.model.AuditLog;
import com.chaintrack.service.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/audit")
@Tag(name = "Audit Log", description = "Immutable audit trail (ADMIN only)")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List audit entries", description = "Paginated audit log, optionally filtered by actor / action / entity type (ADMIN only)")
    public Page<AuditLogResponse> listAuditLog(@RequestParam(required = false) String actor,
                                               @RequestParam(required = false) String action,
                                               @RequestParam(required = false) String entityType,
                                               @PageableDefault(size = 20) Pageable pageable) {
        Page<AuditLog> page = auditLogService.list(actor, action, entityType, pageable);
        return page.map(AuditLogResponse::fromEntity);
    }

    @GetMapping("/verify")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Verify audit chain integrity", description = "Recomputes the SHA-256 hash chain and reports whether any entry was tampered with or deleted (ADMIN only)")
    public Map<String, Object> verifyAuditIntegrity() {
        return auditLogService.verifyIntegrity();
    }
}

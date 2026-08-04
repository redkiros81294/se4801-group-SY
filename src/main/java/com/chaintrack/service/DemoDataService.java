package com.chaintrack.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import java.util.Map;

/**
 * Resets the database to the deterministic demo dataset shipped in
 * {@code V8__seed_data.sql}.
 *
 * <p>Used by ADMINs before a pitch/demo so every session starts from the same
 * known state. The immutable {@code audit_log} and Flyway's history are
 * deliberately <b>not</b> truncated — the reset action itself is audited, and
 * the audit hash-chain stays intact across resets.</p>
 */
@Service
public class DemoDataService {

    private static final Logger log = LoggerFactory.getLogger(DemoDataService.class);

    private final DataSource dataSource;

    public DemoDataService(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /**
     * Truncates all business tables (cascading to respect FKs) and re-applies
     * the seed script. Runs in a single transaction: if reseeding fails, the
     * truncation is rolled back.
     *
     * @return a summary map with {@code reset} = true and {@code seededTables}
     *         describing what was restored
     */
    public Map<String, Object> resetDemoData() {
        try (Connection connection = dataSource.getConnection()) {
            boolean originalAutoCommit = connection.getAutoCommit();
            connection.setAutoCommit(false);
            try {
                truncateBusinessTables(connection);
                ScriptUtils.executeSqlScript(connection, new ClassPathResource("db/migration/V8__seed_data.sql"));
                connection.commit();
                log.info("Demo dataset reset completed");
            } catch (Exception e) {
                connection.rollback();
                log.error("Demo dataset reset failed, rolled back", e);
                throw new IllegalStateException("Demo data reset failed: " + e.getMessage(), e);
            } finally {
                connection.setAutoCommit(originalAutoCommit);
            }
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            log.error("Demo dataset reset failed", e);
            throw new IllegalStateException("Demo data reset failed: " + e.getMessage(), e);
        }
        return Map.of(
            "reset", true,
            "message", "Demo dataset restored to the seeded state"
        );
    }

    private void truncateBusinessTables(Connection connection) throws Exception {
        // Order: children before parents, with CASCADE as a safety net for the
        // self-referencing users table. audit_log is intentionally excluded.
        try (Statement statement = connection.createStatement()) {
            statement.execute("""
                TRUNCATE TABLE
                    jwt_blacklist,
                    invitations,
                    movement_transactions,
                    qr_tokens,
                    batches,
                    products,
                    users,
                    organizations
                RESTART IDENTITY CASCADE
                """);
        }
    }
}

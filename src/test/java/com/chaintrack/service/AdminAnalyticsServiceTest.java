package com.chaintrack.service;

import com.chaintrack.dto.response.AdminAnalyticsResponse;

import com.chaintrack.repository.BatchRepository;
import com.chaintrack.repository.MovementTransactionRepository;
import com.chaintrack.repository.OrganizationRepository;
import com.chaintrack.repository.ProductRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(excludeAutoConfiguration = org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration.class)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@Import(AdminAnalyticsService.class)
class AdminAnalyticsServiceTest {

    @Autowired
    private AdminAnalyticsService adminAnalyticsService;

    // Repositories are intentionally not used directly in this test—service is exercised via the AdminAnalyticsService.
    // Keeping only the service autowired to validate the aggregator behaviour.

    @Test
    @DisplayName("getAnalytics — returns correct counts for empty database")
    void getAnalytics_returnsZeroCounts_whenEmpty() {
        AdminAnalyticsResponse response = adminAnalyticsService.getAnalytics();

        assertThat(response.totalOrganizations()).isEqualTo(0);
        assertThat(response.totalProducts()).isEqualTo(0);
        assertThat(response.totalBatches()).isEqualTo(0);
        assertThat(response.totalTransactions()).isEqualTo(0);
        assertThat(response.batchesCreated()).isEqualTo(0);
        assertThat(response.batchesInTransit()).isEqualTo(0);
        assertThat(response.batchesDelivered()).isEqualTo(0);
        assertThat(response.batchesCompromised()).isEqualTo(0);
    }
}
package com.chaintrack.service;

import com.chaintrack.dto.response.AdminAnalyticsResponse;
import com.chaintrack.model.BatchStatus;
import com.chaintrack.repository.BatchRepository;
import com.chaintrack.repository.MovementTransactionRepository;
import com.chaintrack.repository.OrganizationRepository;
import com.chaintrack.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AdminAnalyticsService {

    private final OrganizationRepository organizationRepository;
    private final ProductRepository productRepository;
    private final BatchRepository batchRepository;
    private final MovementTransactionRepository transactionRepository;

    public AdminAnalyticsService(OrganizationRepository organizationRepository,
                                 ProductRepository productRepository,
                                 BatchRepository batchRepository,
                                 MovementTransactionRepository transactionRepository) {
        this.organizationRepository = organizationRepository;
        this.productRepository = productRepository;
        this.batchRepository = batchRepository;
        this.transactionRepository = transactionRepository;
    }

    /**
     * Returns aggregated statistics for the admin analytics dashboard.
     */
    public AdminAnalyticsResponse getAnalytics() {
        long totalOrganizations = organizationRepository.count();
        long totalProducts = productRepository.count();
        long totalBatches = batchRepository.count();
        long totalTransactions = transactionRepository.count();

        // Batch status counts
        long batchesCreated = batchRepository.countByStatus(BatchStatus.CREATED);
        long batchesInTransit = batchRepository.countByStatus(BatchStatus.IN_TRANSIT);
        long batchesDelivered = batchRepository.countByStatus(BatchStatus.DELIVERED);
        long batchesCompromised = batchRepository.countByStatus(BatchStatus.COMPROMISED);

        return new AdminAnalyticsResponse(
            totalOrganizations,
            totalProducts,
            totalBatches,
            totalTransactions,
            batchesCreated,
            batchesInTransit,
            batchesDelivered,
            batchesCompromised
        );
    }
}
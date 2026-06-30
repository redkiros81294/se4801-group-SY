package com.chaintrack.service;

import com.chaintrack.dto.response.AdminAnalyticsResponse;
import com.chaintrack.model.BatchStatus;
import com.chaintrack.repository.BatchRepository;
import com.chaintrack.repository.MovementTransactionRepository;
import com.chaintrack.repository.OrganizationRepository;
import com.chaintrack.repository.ProductRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AdminAnalyticsService {

    private final OrganizationRepository organizationRepository;
    private final ProductRepository productRepository;
    private final BatchRepository batchRepository;
    private final MovementTransactionRepository transactionRepository;
    
    @PersistenceContext
    private EntityManager entityManager;

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

        // Batch status counts - use native SQL query with explicit enum cast
        long batchesCreated = countByStatusNative(BatchStatus.CREATED.name());
        long batchesInTransit = countByStatusNative(BatchStatus.IN_TRANSIT.name());
        long batchesDelivered = countByStatusNative(BatchStatus.DELIVERED.name());
        long batchesCompromised = countByStatusNative(BatchStatus.COMPROMISED.name());

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
    
    private long countByStatusNative(String statusName) {
        // Cast string to PostgreSQL enum type explicitly
        return ((Number) entityManager.createNativeQuery(
            "SELECT COUNT(id) FROM batches WHERE status = CAST(? AS batch_status)")
            .setParameter(1, statusName)
            .getSingleResult()).longValue();
    }
}

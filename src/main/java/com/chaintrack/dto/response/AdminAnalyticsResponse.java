package com.chaintrack.dto.response;

/**
 * Aggregated analytics returned by AdminAnalyticsService for the admin dashboard.
 */
public record AdminAnalyticsResponse(
    long totalOrganizations,
    long totalProducts,
    long totalBatches,
    long totalTransactions,
    long batchesCreated,
    long batchesInTransit,
    long batchesDelivered,
    long batchesCompromised
) {}
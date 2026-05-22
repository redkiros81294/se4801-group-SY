package com.chaintrack.model;

/**
 * Outcome of a hash-chain verification for a batch's movement ledger.
 * Used by ChainVerificationService and downstream verify endpoints / analytics.
 */
public enum ChainStatus {
    VALID,
    COMPROMISED
}

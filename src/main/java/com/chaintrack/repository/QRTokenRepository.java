package com.chaintrack.repository;

import com.chaintrack.model.Batch;
import com.chaintrack.model.QRToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface QRTokenRepository extends JpaRepository<QRToken, UUID> {
    Optional<QRToken> findByTokenValue(UUID tokenValue);

    Optional<QRToken> findByBatch(Batch batch);
}
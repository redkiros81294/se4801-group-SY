package com.chaintrack.repository;

import com.chaintrack.model.JwtBlacklist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface JwtBlacklistRepository extends JpaRepository<JwtBlacklist, UUID> {
    Optional<JwtBlacklist> findByTokenValue(String tokenValue);
    boolean existsByTokenValue(String tokenValue);
    void deleteByExpiryTimeBefore(java.time.Instant expiryTime);
}
package com.chaintrack.repository;

import com.chaintrack.model.RefreshToken;
import com.chaintrack.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByTokenValue(String tokenValue);
    boolean existsByTokenValue(String tokenValue);
    List<RefreshToken> findByUserIdAndRevokedFalseAndExpiryTimeAfter(UUID userId, Instant now);
    void deleteByExpiryTimeBefore(Instant now);
}

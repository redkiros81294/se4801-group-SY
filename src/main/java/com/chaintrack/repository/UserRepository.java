package com.chaintrack.repository;

import com.chaintrack.model.User;
import com.chaintrack.model.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    User findByEmail(String email);
    Optional<User> findByInvitationToken(String token);
    boolean existsByEmail(String email);
    List<User> findByStatus(UserStatus status);
    Page<User> findByStatus(UserStatus status, Pageable pageable);
    boolean existsByEmailAndStatus(String email, UserStatus status);
}

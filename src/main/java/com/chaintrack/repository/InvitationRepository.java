package com.chaintrack.repository;

import com.chaintrack.model.Invitation;
import com.chaintrack.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;
import java.util.UUID;

@Repository
public interface InvitationRepository extends JpaRepository<Invitation, UUID> {
    Optional<Invitation> findByToken(String token);
    List<Invitation> findByInvitedBy(User user);
    List<Invitation> findByEmail(String email);
    boolean existsByEmailAndStatus(String email, Invitation.InvitationStatus status);
}
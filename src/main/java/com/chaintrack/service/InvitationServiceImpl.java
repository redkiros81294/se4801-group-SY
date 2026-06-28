package com.chaintrack.service;

import com.chaintrack.dto.request.AcceptInvitationRequest;
import com.chaintrack.dto.request.InviteUserRequest;
import com.chaintrack.dto.response.InvitationResponse;
import com.chaintrack.dto.response.UserResponse;
import com.chaintrack.exception.ResourceNotFoundException;
import com.chaintrack.model.Invitation;
import com.chaintrack.model.Organization;
import com.chaintrack.model.User;
import com.chaintrack.model.UserStatus;
import com.chaintrack.repository.InvitationRepository;
import com.chaintrack.repository.OrganizationRepository;
import com.chaintrack.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class InvitationServiceImpl implements InvitationService {

    private final InvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public InvitationServiceImpl(InvitationRepository invitationRepository,
                                  UserRepository userRepository,
                                  OrganizationRepository organizationRepository) {
        this.invitationRepository = invitationRepository;
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.passwordEncoder = new BCryptPasswordEncoder(12);
    }

    @Override
    @Transactional
    public InvitationResponse createInvitation(InviteUserRequest request, User admin) {
        if (userRepository.existsByEmailAndStatus(request.email(), UserStatus.ACTIVE)) {
            throw new IllegalArgumentException("User already exists with email: " + request.email());
        }

        // Check for pending invitations for this email
        List<Invitation> existingInvitations = invitationRepository.findByEmail(request.email());
        for (Invitation existing : existingInvitations) {
            if (existing.getStatus() == Invitation.InvitationStatus.PENDING 
                    && existing.getExpiresAt().isAfter(Instant.now())) {
                throw new IllegalArgumentException("Pending invitation already exists for email: " + request.email());
            }
        }

        Organization org = organizationRepository.findById(UUID.fromString(request.orgId()))
            .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", request.orgId()));

        Invitation invitation = Invitation.builder()
            .email(request.email())
            .role(request.role())
            .org(org)
            .invitedBy(admin)
            .token(generateToken())
            .expiresAt(Instant.now().plusDays(7))
            .build();

        Invitation saved = invitationRepository.save(invitation);
        return InvitationResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public UserResponse acceptInvitation(AcceptInvitationRequest request) {
        Invitation invitation = invitationRepository.findByToken(request.token())
            .orElseThrow(() -> new ResourceNotFoundException("Invitation", "token", request.token()));

        if (invitation.getStatus() != Invitation.InvitationStatus.PENDING) {
            throw new IllegalArgumentException("Invitation is not pending: " + invitation.getStatus());
        }

        if (invitation.getExpiresAt().isBefore(Instant.now())) {
            invitation.setStatus(Invitation.InvitationStatus.EXPIRED);
            invitationRepository.save(invitation);
            throw new IllegalArgumentException("Invitation has expired");
        }

        if (userRepository.existsByEmail(invitation.getEmail())) {
            throw new IllegalArgumentException("User already exists with email: " + invitation.getEmail());
        }

        String passwordHash = passwordEncoder.encode(request.password());

        // Create user with PENDING status (not ACTIVE) - admin must approve
        User user = User.builder()
            .email(invitation.getEmail())
            .passwordHash(passwordHash)
            .role(invitation.getRole())
            .org(invitation.getOrg())
            .status(UserStatus.PENDING)
            .invitationToken(invitation.getToken())
            .invitedBy(invitation.getInvitedBy())
            .invitedAt(invitation.getCreatedAt())
            .build();

        User savedUser = userRepository.save(user);

        invitation.setStatus(Invitation.InvitationStatus.ACCEPTED);
        invitation.setAcceptedAt(Instant.now());
        invitationRepository.save(invitation);

        return UserResponse.fromEntity(savedUser);
    }

    @Override
    public InvitationResponse getInvitationByToken(String token) {
        Invitation invitation = invitationRepository.findByToken(token)
            .orElseThrow(() -> new ResourceNotFoundException("Invitation", "token", token));
        return InvitationResponse.fromEntity(invitation);
    }

    @Override
    public List<InvitationResponse> listAllInvitations() {
        return invitationRepository.findAll().stream()
            .map(InvitationResponse::fromEntity)
            .toList();
    }

    @Override
    @Transactional
    public InvitationResponse revokeInvitation(String invitationId) {
        Invitation invitation = invitationRepository.findById(UUID.fromString(invitationId))
            .orElseThrow(() -> new ResourceNotFoundException("Invitation", "id", invitationId));

        if (invitation.getStatus() != Invitation.InvitationStatus.PENDING) {
            throw new IllegalArgumentException("Can only revoke pending invitations");
        }

        invitation.setStatus(Invitation.InvitationStatus.REVOKED);
        invitation.setRevokedAt(Instant.now());
        Invitation saved = invitationRepository.save(invitation);
        return InvitationResponse.fromEntity(saved);
    }

    private String generateToken() {
        return UUID.randomUUID().toString().replace("-", "") + System.currentTimeMillis();
    }
}
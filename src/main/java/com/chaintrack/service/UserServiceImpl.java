package com.chaintrack.service;

import com.chaintrack.dto.request.AcceptInvitationRequest;
import com.chaintrack.dto.request.ApproveUserRequest;
import com.chaintrack.dto.request.InviteUserRequest;
import com.chaintrack.dto.response.InvitationResponse;
import com.chaintrack.dto.response.UserResponse;
import com.chaintrack.exception.ResourceNotFoundException;
import com.chaintrack.model.User;
import com.chaintrack.model.UserStatus;
import com.chaintrack.repository.InvitationRepository;
import com.chaintrack.repository.UserRepository;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final InvitationRepository invitationRepository;
    private final InvitationService invitationService;

    public UserServiceImpl(UserRepository userRepository,
                           InvitationRepository invitationRepository,
                           InvitationService invitationService) {
        this.userRepository = userRepository;
        this.invitationRepository = invitationRepository;
        this.invitationService = invitationService;
    }

    @Override
    @Transactional
    public InvitationResponse inviteUser(InviteUserRequest request, String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail);
        return invitationService.createInvitation(request, admin);
    }

    @Override
    @Transactional
    public InvitationResponse acceptInvitation(AcceptInvitationRequest request) {
        return invitationService.acceptInvitation(request);
    }

    @Override
    @Transactional
    public UserResponse approveUser(String userId, ApproveUserRequest request) {
        if (StringUtils.isBlank(userId)) {
            throw new IllegalArgumentException("User id must not be blank");
        }

        User user = userRepository.findById(UUID.fromString(userId))
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getStatus() != UserStatus.PENDING) {
            throw new IllegalArgumentException("User is not in PENDING status: " + user.getStatus());
        }

        User admin = userRepository.findById(UUID.fromString(request.adminId()))
            .orElseThrow(() -> new ResourceNotFoundException("Admin user", "id", request.adminId()));

        user.setStatus(UserStatus.ACTIVE);
        user.setApprovedAt(Instant.now());
        user.setApprovedBy(admin);

        User saved = userRepository.save(user);
        return UserResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public UserResponse rejectUser(String userId, ApproveUserRequest request) {
        if (StringUtils.isBlank(userId)) {
            throw new IllegalArgumentException("User id must not be blank");
        }

        User user = userRepository.findById(UUID.fromString(userId))
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getStatus() != UserStatus.PENDING) {
            throw new IllegalArgumentException("User is not in PENDING status: " + user.getStatus());
        }

        User admin = userRepository.findById(UUID.fromString(request.adminId()))
            .orElseThrow(() -> new ResourceNotFoundException("Admin user", "id", request.adminId()));

        user.setStatus(UserStatus.DEACTIVATED);
        user.setRejectedAt(Instant.now());
        user.setRejectedBy(admin);
        user.setRejectionReason(request.rejectionReason());

        User saved = userRepository.save(user);
        return UserResponse.fromEntity(saved);
    }

    @Override
    public List<UserResponse> listPendingUsers() {
        return userRepository.findByStatus(UserStatus.PENDING).stream()
            .map(UserResponse::fromEntity)
            .toList();
    }

    @Override
    public UserResponse getUserById(String id) {
        if (StringUtils.isBlank(id)) {
            throw new IllegalArgumentException("User id must not be blank");
        }
        User user = userRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return UserResponse.fromEntity(user);
    }

    @Override
    public Page<UserResponse> listUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
            .map(UserResponse::fromEntity);
    }

    @Override
    @Transactional
    public UserResponse deactivateUser(String id) {
        if (StringUtils.isBlank(id)) {
            throw new IllegalArgumentException("User id must not be blank");
        }
        User user = userRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        user.setStatus(UserStatus.DEACTIVATED);
        User saved = userRepository.save(user);
        return UserResponse.fromEntity(saved);
    }
}
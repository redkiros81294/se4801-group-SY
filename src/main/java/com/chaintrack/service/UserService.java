package com.chaintrack.service;

import com.chaintrack.dto.request.AcceptInvitationRequest;
import com.chaintrack.dto.request.ApproveUserRequest;
import com.chaintrack.dto.request.CreateUserRequest;
import com.chaintrack.dto.request.InviteUserRequest;
import com.chaintrack.dto.response.InvitationResponse;
import com.chaintrack.dto.response.UserResponse;
import com.chaintrack.model.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface UserService {

    /**
     * ADMIN creates a user account directly. The account is ACTIVE immediately —
     * no invitation email or approval step required.
     */
    UserResponse createUser(CreateUserRequest request);

    /**
     * Changes the authenticated user's own password after verifying the current
     * password. New password is BCrypt(12) hashed before storage.
     */
    UserResponse changePassword(String email, String currentPassword, String newPassword);

    InvitationResponse inviteUser(InviteUserRequest request, String adminEmail);

    UserResponse acceptInvitation(AcceptInvitationRequest request);

    UserResponse approveUser(String userId, ApproveUserRequest request);

    UserResponse rejectUser(String userId, ApproveUserRequest request);

    List<UserResponse> listPendingUsers();

    UserResponse getUserById(String id);

    Page<UserResponse> listUsers(Pageable pageable);

    UserResponse deactivateUser(String id);
}
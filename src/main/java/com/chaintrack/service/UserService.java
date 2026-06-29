package com.chaintrack.service;

import com.chaintrack.dto.request.AcceptInvitationRequest;
import com.chaintrack.dto.request.ApproveUserRequest;
import com.chaintrack.dto.request.InviteUserRequest;
import com.chaintrack.dto.response.InvitationResponse;
import com.chaintrack.dto.response.UserResponse;
import com.chaintrack.model.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface UserService {

    InvitationResponse inviteUser(InviteUserRequest request, String adminEmail);

    UserResponse acceptInvitation(AcceptInvitationRequest request);

    UserResponse approveUser(String userId, ApproveUserRequest request);

    UserResponse rejectUser(String userId, ApproveUserRequest request);

    List<UserResponse> listPendingUsers();

    UserResponse getUserById(String id);

    Page<UserResponse> listUsers(Pageable pageable);

    UserResponse deactivateUser(String id);
}
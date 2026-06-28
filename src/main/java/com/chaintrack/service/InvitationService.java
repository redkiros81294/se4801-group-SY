package com.chaintrack.service;

import com.chaintrack.dto.request.AcceptInvitationRequest;
import com.chaintrack.dto.request.InviteUserRequest;
import com.chaintrack.dto.response.InvitationResponse;
import com.chaintrack.dto.response.UserResponse;
import com.chaintrack.model.User;
import java.util.List;

public interface InvitationService {
    InvitationResponse createInvitation(InviteUserRequest request, User admin);
    
    UserResponse acceptInvitation(AcceptInvitationRequest request);
    
    InvitationResponse getInvitationByToken(String token);
    
    List<InvitationResponse> listAllInvitations();
    
    InvitationResponse revokeInvitation(String invitationId);
}

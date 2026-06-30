package com.chaintrack.service;

public interface EmailService {
    void sendInvitationEmail(String toEmail, String token, String invitedBy, String organizationName);
}

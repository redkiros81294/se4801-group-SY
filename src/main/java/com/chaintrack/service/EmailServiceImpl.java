package com.chaintrack.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${frontend.url}")
    private String frontendUrl;

    @Value("${spring.mail.username:noreply@chaintrack.com}")
    private String fromEmail;

    public EmailServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendInvitationEmail(String toEmail, String token, String invitedBy, String organizationName) {
        String invitationUrl = frontendUrl + "/accept-invitation?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Invitation to join ChainTrack");
        message.setText(String.format(
            "Hello,\n\n" +
            "You have been invited by %s to join the organization '%s' on ChainTrack.\n\n" +
            "Please click the link below to accept your invitation and set up your account:\n" +
            "%s\n\n" +
            "This invitation link will expire in 7 days.\n\n" +
            "Best regards,\n" +
            "The ChainTrack Team",
            invitedBy, organizationName, invitationUrl
        ));

        mailSender.send(message);
    }
}

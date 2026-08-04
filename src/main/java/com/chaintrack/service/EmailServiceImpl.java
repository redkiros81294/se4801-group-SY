package com.chaintrack.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * Sends invitation emails.
 *
 * <p>Provider resolution:</p>
 * <ol>
 *   <li><b>Resend</b> (enterprise provider, used when {@code RESEND_API_KEY} is set) —
 *       REST API via Spring's {@link RestClient}, no extra dependency, with a branded
 *       HTML template. Set {@code EMAIL_PROVIDER=resend} to force it, or leave {@code auto}
 *       to fall back to SMTP when the key is missing.</li>
 *   <li><b>SMTP</b> (the existing {@code spring.mail.*} configuration) otherwise — works
 *       out of the box in dev without any external account.</li>
 * </ol>
 */
@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    private static final String RESEND_API_URL = "https://api.resend.com/emails";

    private final JavaMailSender mailSender;
    private final RestClient resendClient;
    private final boolean resendEnabled;
    private final boolean smtpConfigured;

    @Value("${frontend.url}")
    private String frontendUrl;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Value("${app.email.from:}")
    private String configuredFrom;

    public EmailServiceImpl(JavaMailSender mailSender,
                            @Value("${app.email.resend.api-key:}") String resendApiKey,
                            @Value("${app.email.provider:auto}") String provider) {
        this.mailSender = mailSender;
        boolean keyPresent = resendApiKey != null && !resendApiKey.isBlank();
        this.resendEnabled = keyPresent && (!"smtp".equalsIgnoreCase(provider) || "resend".equalsIgnoreCase(provider));
        this.smtpConfigured = !this.resendEnabled;
        this.resendClient = this.resendEnabled
            ? RestClient.builder()
                .baseUrl(RESEND_API_URL)
                .defaultHeader("Authorization", "Bearer " + resendApiKey)
                .build()
            : null;
        if (this.resendEnabled) {
            log.info("Email delivery via Resend (provider={})", provider);
        } else {
            log.info("Email delivery via SMTP (provider={}, resend key {})", provider,
                keyPresent ? "present but disabled" : "not set");
        }
    }

    @Override
    public void sendInvitationEmail(String toEmail, String token, String invitedBy, String organizationName) {
        String invitationUrl = frontendUrl + "/accept-invitation?token=" + token;
        if (resendEnabled && resendClient != null) {
            sendViaResend(toEmail, invitationUrl, invitedBy, organizationName);
        } else if (smtpConfigured) {
            sendViaSmtp(toEmail, invitationUrl, invitedBy, organizationName);
        } else {
            log.warn("No email provider configured — invitation for {} was not emailed (link: {})", toEmail, invitationUrl);
        }
    }

    private void sendViaResend(String toEmail, String invitationUrl, String invitedBy, String organizationName) {
        String html = """
            <div style="font-family:Segoe UI,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#0A0F1E;border-radius:12px;color:#F1F5F9">
              <div style="text-align:center;margin-bottom:24px">
                <span style="font-size:22px;font-weight:700">Chain<span style="color:#06B6D4">Track</span></span>
              </div>
              <h2 style="margin:0 0 12px;font-size:20px">You're invited</h2>
              <p style="color:#94A3B8;line-height:1.6;margin:0 0 20px">
                <strong style="color:#F1F5F9">%s</strong> has invited you to join the organization
                <strong style="color:#06B6D4">%s</strong> on ChainTrack.
              </p>
              <div style="text-align:center;margin:28px 0">
                <a href="%s" style="display:inline-block;background:#2563EB;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600">Accept invitation</a>
              </div>
              <p style="color:#64748B;font-size:13px;line-height:1.5;margin:0">
                This link expires in 7 days. If you did not expect this invitation, you can safely ignore this email.
              </p>
            </div>
            """.formatted(escapeHtml(invitedBy), escapeHtml(organizationName), invitationUrl);

        Map<String, Object> payload = Map.of(
            "from", effectiveFrom(),
            "to", java.util.List.of(toEmail),
            "subject", "Invitation to join " + organizationName + " on ChainTrack",
            "html", html
        );

        try {
            resendClient.post()
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload)
                .retrieve()
                .toBodilessEntity();
            log.info("Invitation email sent via Resend to {}", toEmail);
        } catch (Exception e) {
            log.error("Resend delivery failed for {}: {}", toEmail, e.getMessage());
        }
    }

    private void sendViaSmtp(String toEmail, String invitationUrl, String invitedBy, String organizationName) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail != null && !fromEmail.isBlank() ? fromEmail : "chaintrack@localhost");
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
        try {
            mailSender.send(message);
            log.info("Invitation email sent via SMTP to {}", toEmail);
        } catch (Exception e) {
            log.warn("SMTP delivery failed for {} (mail not configured?): {}", toEmail, e.getMessage());
        }
    }

    private String effectiveFrom() {
        if (configuredFrom != null && !configuredFrom.isBlank()) {
            return configuredFrom;
        }
        if (fromEmail != null && !fromEmail.isBlank() && fromEmail.contains("@")) {
            return fromEmail;
        }
        return "ChainTrack <onboarding@resend.dev>";
    }

    private static String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}

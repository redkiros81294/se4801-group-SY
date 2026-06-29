package com.chaintrack.integration;

import com.chaintrack.ChaintrackApplication;
import com.chaintrack.model.Organization;
import com.chaintrack.model.Organization.OrgType;
import com.chaintrack.model.Role;
import com.chaintrack.model.User;
import com.chaintrack.model.UserStatus;
import com.chaintrack.repository.OrganizationRepository;
import com.chaintrack.repository.UserRepository;
import com.chaintrack.security.JwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.fasterxml.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = ChaintrackApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@Testcontainers
class AuthInvitationIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("chaintrack_test")
            .withUsername("test")
            .withPassword("test");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        organizationRepository.deleteAll();

        Organization org = Organization.builder()
                .name("Invitation Test Organization")
                .orgType(OrgType.MANUFACTURER)
                .build();
        organizationRepository.save(org);

        User admin = User.builder()
                .email("admin@invitation-test.com")
                .passwordHash("$2a$12$hashedpassword")
                .role(Role.ADMIN)
                .org(org)
                .status(UserStatus.ACTIVE)
                .build();
        userRepository.save(admin);
    }

    private String obtainAdminToken() {
        User admin = userRepository.findAll().get(0);
        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(admin.getEmail())
                .password(admin.getPasswordHash())
                .roles(admin.getRole().name())
                .build();
        return jwtUtils.generateToken(
                userDetails,
                admin.getId().toString(),
                admin.getOrg().getId().toString(),
                admin.getRole().name(),
                admin.getStatus().name()
        );
    }

    @Test
    @DisplayName("Full invitation flow: invite → accept → approve → login")
    void fullInvitationFlow_acceptedUserCanLogin() throws Exception {
        String adminToken = obtainAdminToken();

        String inviteRequest = """
                {
                    "email": "newuser@invitation-test.com",
                    "role": "MANUFACTURER",
                    "orgId": "%s"
                }
                """.formatted(organizationRepository.findAll().get(0).getId().toString());

        String inviteResponse = mockMvc.perform(post("/api/auth/invite")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(inviteRequest))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("newuser@invitation-test.com"))
                .andExpect(jsonPath("$.role").value("MANUFACTURER"))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String invitationToken = objectMapper.readTree(inviteResponse).get("token").asText();

        String acceptRequest = """
                {
                    "token": "%s",
                    "password": "NewUserPass123!"
                }
                """.formatted(invitationToken);

        mockMvc.perform(post("/api/auth/invitations/accept")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(acceptRequest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("newuser@invitation-test.com"))
                .andExpect(jsonPath("$.status").value("PENDING"));

        User pendingUser = userRepository.findAll().get(1);
        String pendingUserId = pendingUser.getId().toString();

        String approveRequest = """
                {
                    "adminId": "%s"
                }
                """.formatted(userRepository.findAll().get(0).getId().toString());

        mockMvc.perform(post("/api/admin/users/" + pendingUserId + "/approve")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(approveRequest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("newuser@invitation-test.com"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        User approvedUser = userRepository.findById(pendingUser.getId()).orElseThrow();
        assertThat(approvedUser.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(approvedUser.getApprovedBy()).isNotNull();
        assertThat(approvedUser.getApprovedAt()).isNotNull();
    }
}

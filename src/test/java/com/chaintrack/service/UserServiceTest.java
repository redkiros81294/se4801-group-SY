package com.chaintrack.service;

import com.chaintrack.dto.request.AcceptInvitationRequest;
import com.chaintrack.dto.request.ApproveUserRequest;
import com.chaintrack.dto.request.CreateUserRequest;
import com.chaintrack.dto.request.InviteUserRequest;
import com.chaintrack.dto.response.UserResponse;
import com.chaintrack.model.Organization;
import com.chaintrack.model.Organization.OrgType;
import com.chaintrack.model.Role;
import com.chaintrack.model.User;
import com.chaintrack.model.UserStatus;
import com.chaintrack.repository.InvitationRepository;
import com.chaintrack.repository.OrganizationRepository;
import com.chaintrack.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest(excludeAutoConfiguration = org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration.class)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@Import({UserServiceImpl.class, InvitationServiceImpl.class})
class UserServiceTest {

    @Autowired
    private TestEntityManager entityManager;

@Autowired
    private UserService userService;

    @MockBean
    private EmailService emailService;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private UserRepository userRepository;

    private Organization manufacturerOrg;
    private Organization shipperOrg;

    @BeforeEach
    void setUp() {
        manufacturerOrg = Organization.builder()
            .name("Test Pharma Ltd.")
            .orgType(OrgType.MANUFACTURER)
            .build();
        entityManager.persistAndFlush(manufacturerOrg);
        
        shipperOrg = Organization.builder()
            .name("Test Logistics")
            .orgType(OrgType.SHIPPER)
            .build();
        entityManager.persistAndFlush(shipperOrg);
        
        // Create admin user for invitations
        User admin = User.builder()
            .email("admin@test.com")
            .passwordHash("$2a$12$hashedpassword")
            .role(Role.ADMIN)
            .org(manufacturerOrg)
            .status(UserStatus.ACTIVE)
            .build();
        entityManager.persistAndFlush(admin);
    }

    // ── createUser ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("createUser — creates an ACTIVE user directly")
    void createUser_createsActiveUser() {
        CreateUserRequest request = new CreateUserRequest(
            "direct@example.com",
            Role.MANUFACTURER,
            manufacturerOrg.getId().toString(),
            "TempPass123!"
        );

        UserResponse response = userService.createUser(request);

        assertThat(response.email()).isEqualTo("direct@example.com");
        assertThat(response.role()).isEqualTo(Role.MANUFACTURER);
        assertThat(response.orgId()).isEqualTo(manufacturerOrg.getId().toString());
        assertThat(response.status()).isEqualTo(UserStatus.ACTIVE);

        // The password must be BCrypt-hashed, never stored in plain text
        User stored = userRepository.findByEmail("direct@example.com");
        assertThat(stored).isNotNull();
        assertThat(stored.getPasswordHash()).isNotEqualTo("TempPass123!");
        assertThat(stored.getPasswordHash()).startsWith("$2a$12$");
    }

    @Test
    @DisplayName("createUser — throws when the email already exists")
    void createUser_throws_whenEmailExists() {
        entityManager.persistAndFlush(User.builder()
            .email("taken@example.com")
            .passwordHash("$2a$12$hashedpassword")
            .role(Role.SHIPPER)
            .org(manufacturerOrg)
            .status(UserStatus.ACTIVE)
            .build());

        CreateUserRequest request = new CreateUserRequest(
            "taken@example.com",
            Role.SHIPPER,
            manufacturerOrg.getId().toString(),
            "TempPass123!"
        );

        assertThatThrownBy(() -> userService.createUser(request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("already exists");
    }

    @Test
    @DisplayName("createUser — throws when the organization does not exist")
    void createUser_throws_whenOrgMissing() {
        CreateUserRequest request = new CreateUserRequest(
            "noorganization@example.com",
            Role.RETAILER,
            "00000000-0000-0000-0000-000000000000",
            "TempPass123!"
        );

        assertThatThrownBy(() -> userService.createUser(request))
            .isInstanceOf(com.chaintrack.exception.ResourceNotFoundException.class);
    }

    // ── changePassword ────────────────────────────────────────────────────────

    @Test
    @DisplayName("changePassword — updates the hash when the current password is correct")
    void changePassword_updatesHash_whenCurrentPasswordCorrect() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
        User user = User.builder()
            .email("changeme@example.com")
            .passwordHash(encoder.encode("OldPass123!"))
            .role(Role.RETAILER)
            .org(manufacturerOrg)
            .status(UserStatus.ACTIVE)
            .build();
        entityManager.persistAndFlush(user);

        UserResponse response = userService.changePassword(
            "changeme@example.com", "OldPass123!", "NewPass456!");

        assertThat(response.email()).isEqualTo("changeme@example.com");

        User stored = userRepository.findByEmail("changeme@example.com");
        assertThat(encoder.matches("NewPass456!", stored.getPasswordHash())).isTrue();
        assertThat(encoder.matches("OldPass123!", stored.getPasswordHash())).isFalse();
    }

    @Test
    @DisplayName("changePassword — rejects a wrong current password")
    void changePassword_rejectsWrongCurrentPassword() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
        entityManager.persistAndFlush(User.builder()
            .email("wrongpass@example.com")
            .passwordHash(encoder.encode("OldPass123!"))
            .role(Role.SHIPPER)
            .org(manufacturerOrg)
            .status(UserStatus.ACTIVE)
            .build());

        assertThatThrownBy(() -> userService.changePassword(
            "wrongpass@example.com", "WrongPass999!", "NewPass456!"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Current password is incorrect");
    }

    @Test
    @DisplayName("changePassword — throws when the user does not exist")
    void changePassword_throws_whenUserMissing() {
        assertThatThrownBy(() -> userService.changePassword(
            "nobody@example.com", "OldPass123!", "NewPass456!"))
            .isInstanceOf(com.chaintrack.exception.ResourceNotFoundException.class);
    }

    // ── inviteUser ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("inviteUser — creates invitation successfully")
    void inviteUser_createsInvitation() {
        InviteUserRequest request = new InviteUserRequest(
            "invited@example.com",
            Role.MANUFACTURER,
            manufacturerOrg.getId().toString()
        );

        var response = userService.inviteUser(request, "admin@test.com");

        assertThat(response.email()).isEqualTo("invited@example.com");
        assertThat(response.role()).isEqualTo(Role.MANUFACTURER);
    }

    // ── getUserById ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("getUserById — returns UserResponse when id exists")
    void getUserById_returnsResponse_whenExists() {
        User user = User.builder()
            .email("findme@example.com")
            .passwordHash("$2a$12$hashedpassword")
            .role(Role.SHIPPER)
            .org(manufacturerOrg)
            .status(UserStatus.ACTIVE)
            .build();
        entityManager.persistAndFlush(user);

        UserResponse response = userService.getUserById(user.getId().toString());

        assertThat(response.id()).isEqualTo(user.getId().toString());
        assertThat(response.email()).isEqualTo("findme@example.com");
    }

    @Test
    @DisplayName("getUserById — throws ResourceNotFoundException for missing id")
    void getUserById_throws_whenNotFound() {
        assertThatThrownBy(() -> userService.getUserById("00000000-0000-0000-0000-000000000000"))
            .isInstanceOf(com.chaintrack.exception.ResourceNotFoundException.class)
            .hasMessageContaining("User");
    }

    // ── listUsers ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("listUsers — paginates correctly")
    void listUsers_paginatesCorrectly() {
        User u1 = User.builder().email("u1@example.com").passwordHash("hash").role(Role.SHIPPER).org(manufacturerOrg).status(UserStatus.ACTIVE).build();
        User u2 = User.builder().email("u2@example.com").passwordHash("hash").role(Role.RETAILER).org(manufacturerOrg).status(UserStatus.ACTIVE).build();
        User u3 = User.builder().email("u3@example.com").passwordHash("hash").role(Role.MANUFACTURER).org(manufacturerOrg).status(UserStatus.ACTIVE).build();
        entityManager.persistAndFlush(u1);
        entityManager.persistAndFlush(u2);
        entityManager.persistAndFlush(u3);

        Page<UserResponse> page = userService.listUsers(PageRequest.ofSize(2));

        assertThat(page.getTotalElements()).isEqualTo(4);
        assertThat(page.getContent()).hasSize(2);
    }

    // ── deactivateUser ─────────────────────────────────────────────────────

    @Test
    @DisplayName("deactivateUser — sets status to DEACTIVATED")
    void deactivateUser_setsInactive() {
        User user = User.builder()
            .email("toDeactivate@example.com")
            .passwordHash("hash")
            .role(Role.RETAILER)
            .org(manufacturerOrg)
            .status(UserStatus.ACTIVE)
            .build();
        entityManager.persistAndFlush(user);

        UserResponse response = userService.deactivateUser(user.getId().toString());

        assertThat(response.status()).isEqualTo(UserStatus.DEACTIVATED);
    }

    @Test
    @DisplayName("deactivateUser — throws when user not found")
    void deactivateUser_throws_whenNotFound() {
        assertThatThrownBy(() -> userService.deactivateUser("00000000-0000-0000-0000-000000000000"))
            .isInstanceOf(com.chaintrack.exception.ResourceNotFoundException.class);
    }
}
package com.chaintrack.service;

import com.chaintrack.dto.request.RegisterRequest;
import com.chaintrack.dto.response.UserResponse;
import com.chaintrack.model.Organization;
import com.chaintrack.model.Organization.OrgType;
import com.chaintrack.model.Role;
import com.chaintrack.model.User;
import com.chaintrack.repository.OrganizationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest(excludeAutoConfiguration = org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration.class)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@Import(UserServiceImpl.class)
class UserServiceTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserService userService;

    @Autowired
    private OrganizationRepository organizationRepository;

    private Organization manufacturerOrg;

    @BeforeEach
    void setUp() {
        manufacturerOrg = Organization.builder()
            .name("Test Pharma Ltd.")
            .orgType(OrgType.MANUFACTURER)
            .build();
        entityManager.persistAndFlush(manufacturerOrg);
    }

    // ── register ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("register — creates user with BCrypt hashed password")
    void register_createsUserWithHashedPassword() {
        RegisterRequest request = new RegisterRequest(
            "test@example.com",
            "plainPassword123",
            Role.MANUFACTURER,
            manufacturerOrg.getId()
        );

        UserResponse response = userService.register(request);

        assertThat(response.id()).isNotBlank();
        assertThat(response.email()).isEqualTo("test@example.com");
        assertThat(response.role()).isEqualTo(Role.MANUFACTURER);
        assertThat(response.orgId()).isEqualTo(manufacturerOrg.getId());
        assertThat(response.isActive()).isTrue();
    }

    @Test
    @DisplayName("register — throws when email already exists")
    void register_throwsDuplicateEmail() {
        User existing = User.builder()
            .email("existing@example.com")
            .passwordHash("$2a$12$hashedpassword")
            .role(Role.SHIPPER)
            .org(manufacturerOrg)
            .build();
        entityManager.persistAndFlush(existing);

        RegisterRequest request = new RegisterRequest(
            "existing@example.com",
            "newPassword",
            Role.RETAILER,
            manufacturerOrg.getId()
        );

        assertThatThrownBy(() -> userService.register(request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Email already exists");
    }

    @Test
    @DisplayName("register — throws when org not found")
    void register_throwsOrgNotFound() {
        RegisterRequest request = new RegisterRequest(
            "test2@example.com",
            "password",
            Role.MANUFACTURER,
            "00000000-0000-0000-0000-000000000000"
        );

        assertThatThrownBy(() -> userService.register(request))
            .isInstanceOf(com.chaintrack.exception.ResourceNotFoundException.class);
    }

    // ── getUserById ────────────────────────────────────────────────────────

    @Test
    @DisplayName("getUserById — returns UserResponse when id exists")
    void getUserById_returnsResponse_whenExists() {
        User user = User.builder()
            .email("findme@example.com")
            .passwordHash("$2a$12$hashedpassword")
            .role(Role.SHIPPER)
            .org(manufacturerOrg)
            .build();
        entityManager.persistAndFlush(user);

        UserResponse response = userService.getUserById(user.getId());

        assertThat(response.id()).isEqualTo(user.getId());
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
        User u1 = User.builder().email("u1@example.com").passwordHash("hash").role(Role.SHIPPER).org(manufacturerOrg).build();
        User u2 = User.builder().email("u2@example.com").passwordHash("hash").role(Role.RETAILER).org(manufacturerOrg).build();
        User u3 = User.builder().email("u3@example.com").passwordHash("hash").role(Role.MANUFACTURER).org(manufacturerOrg).build();
        entityManager.persistAndFlush(u1);
        entityManager.persistAndFlush(u2);
        entityManager.persistAndFlush(u3);

        Page<UserResponse> page = userService.listUsers(PageRequest.ofSize(2));

        assertThat(page.getTotalElements()).isEqualTo(3);
        assertThat(page.getContent()).hasSize(2);
    }

    // ── deactivateUser ─────────────────────────────────────────────────────

    @Test
    @DisplayName("deactivateUser — sets isActive to false")
    void deactivateUser_setsInactive() {
        User user = User.builder()
            .email("toDeactivate@example.com")
            .passwordHash("hash")
            .role(Role.RETAILER)
            .org(manufacturerOrg)
            .isActive(true)
            .build();
        entityManager.persistAndFlush(user);

        UserResponse response = userService.deactivateUser(user.getId());

        assertThat(response.isActive()).isFalse();
    }

    @Test
    @DisplayName("deactivateUser — throws when user not found")
    void deactivateUser_throws_whenNotFound() {
        assertThatThrownBy(() -> userService.deactivateUser("00000000-0000-0000-0000-000000000000"))
            .isInstanceOf(com.chaintrack.exception.ResourceNotFoundException.class);
    }
}
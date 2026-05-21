package com.chaintrack.service;

import com.chaintrack.dto.request.RegisterRequest;
import com.chaintrack.dto.response.UserResponse;
import com.chaintrack.model.Organization;
import com.chaintrack.model.User;
import com.chaintrack.repository.OrganizationRepository;
import com.chaintrack.repository.UserRepository;
import com.chaintrack.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static org.apache.commons.lang3.StringUtils.isBlank;

@Service
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository,
                          OrganizationRepository organizationRepository) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.passwordEncoder = new BCryptPasswordEncoder(12);
    }

    @Override
    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (isBlank(request.email())) {
            throw new IllegalArgumentException("Email must not be blank");
        }
        if (isBlank(request.password())) {
            throw new IllegalArgumentException("Password must not be blank");
        }
        if (request.role() == null) {
            throw new IllegalArgumentException("Role must not be null");
        }
        if (isBlank(request.orgId())) {
            throw new IllegalArgumentException("Organization id must not be blank");
        }

        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already exists: " + request.email());
        }

        Organization org = organizationRepository.findById(request.orgId())
            .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", request.orgId()));

        String passwordHash = passwordEncoder.encode(request.password());

        User user = User.builder()
            .email(request.email())
            .passwordHash(passwordHash)
            .role(request.role())
            .org(org)
            .isActive(true)
            .build();

        User saved = userRepository.save(user);
        return UserResponse.fromEntity(saved);
    }

    @Override
    public UserResponse getUserById(String id) {
        if (isBlank(id)) {
            throw new IllegalArgumentException("User id must not be blank");
        }
        User user = userRepository.findById(id)
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
        if (isBlank(id)) {
            throw new IllegalArgumentException("User id must not be blank");
        }
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        user.setActive(false);
        User saved = userRepository.save(user);
        return UserResponse.fromEntity(saved);
    }
}
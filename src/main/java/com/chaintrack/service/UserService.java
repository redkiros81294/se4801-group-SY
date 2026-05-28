package com.chaintrack.service;

import com.chaintrack.dto.request.RegisterRequest;
import com.chaintrack.dto.response.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserService {

    UserResponse register(RegisterRequest request);

    UserResponse getUserById(String id);

    Page<UserResponse> listUsers(Pageable pageable);

    UserResponse deactivateUser(String id);
}
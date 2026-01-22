package com.workflow.backend.controller;

import com.workflow.backend.dto.LoginRequest;
import com.workflow.backend.dto.RegisterRequest;
import com.workflow.backend.dto.UserResponse;
import com.workflow.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth") // Bu sınıftaki tüm adresler "/auth" ile başlar
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    // POST http://localhost:8080/auth/register
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        UserResponse result = userService.register(request);
        return ResponseEntity.ok(result);
    }

    // POST http://localhost:8080/auth/login
    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@Valid @RequestBody LoginRequest request) {
        UserResponse result = userService.login(request);
        return ResponseEntity.ok(result);
    }
}
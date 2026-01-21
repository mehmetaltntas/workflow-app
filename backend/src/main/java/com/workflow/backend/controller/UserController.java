package com.workflow.backend.controller;

import com.workflow.backend.dto.UpdatePasswordRequest;
import com.workflow.backend.dto.UpdateProfileRequest;
import com.workflow.backend.dto.UserResponse;
import com.workflow.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // GET http://localhost:8080/users/{id}
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
        UserResponse user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    // PUT http://localhost:8080/users/{id}/profile
    @PutMapping("/{id}/profile")
    public ResponseEntity<UserResponse> updateProfile(
            @PathVariable Long id,
            @RequestBody UpdateProfileRequest request) {
        UserResponse updated = userService.updateProfile(id, request);
        return ResponseEntity.ok(updated);
    }

    // PUT http://localhost:8080/users/{id}/password
    @PutMapping("/{id}/password")
    public ResponseEntity<String> updatePassword(
            @PathVariable Long id,
            @RequestBody UpdatePasswordRequest request) {
        userService.updatePassword(id, request);
        return ResponseEntity.ok("Şifre başarıyla güncellendi!");
    }
}

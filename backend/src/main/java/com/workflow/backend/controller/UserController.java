package com.workflow.backend.controller;

import com.workflow.backend.dto.UpdatePasswordRequest;
import com.workflow.backend.dto.UpdateProfileRequest;
import com.workflow.backend.dto.UserResponse;
import com.workflow.backend.hateoas.assembler.UserModelAssembler;
import com.workflow.backend.hateoas.model.UserModel;
import com.workflow.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.hateoas.RepresentationModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserModelAssembler userAssembler;

    // GET http://localhost:8080/users/{id}
    @GetMapping("/{id}")
    public ResponseEntity<UserModel> getUser(@PathVariable Long id) {
        UserResponse user = userService.getUserById(id);
        UserModel model = userAssembler.toModel(user);
        return ResponseEntity.ok(model);
    }

    // PUT http://localhost:8080/users/{id}/profile
    @PutMapping("/{id}/profile")
    public ResponseEntity<UserModel> updateProfile(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserResponse updated = userService.updateProfile(id, request);
        UserModel model = userAssembler.toModel(updated);
        return ResponseEntity.ok(model);
    }

    // PUT http://localhost:8080/users/{id}/password
    @PutMapping("/{id}/password")
    public ResponseEntity<RepresentationModel<?>> updatePassword(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePasswordRequest request) {
        userService.updatePassword(id, request);

        RepresentationModel<?> response = new RepresentationModel<>();
        response.add(linkTo(methodOn(UserController.class).getUser(id)).withRel("user"));
        response.add(linkTo(methodOn(UserController.class).updateProfile(id, null)).withRel("update-profile"));

        return ResponseEntity.ok(response);
    }
}

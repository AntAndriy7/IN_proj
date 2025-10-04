package com.example.in_proj.controllers;

import com.example.in_proj.auth.JwtUtil;
import com.example.in_proj.dto.AuthDTO;
import com.example.in_proj.dto.UserDTO;
import com.example.in_proj.entity.User;
import com.example.in_proj.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<UserDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUser(@PathVariable Long id) {
        UserDTO user = userService.getUser(id);
        if (user == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(user);
    }

    @GetMapping("/plane/{planeId}")
    public ResponseEntity<List<User>> getUsersByPlaneId(@PathVariable Long planeId) {
        List<User> users = userService.getUsersByPlaneId(planeId);
        if (users.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(users);
    }

    @GetMapping("/out")
    public ResponseEntity<List<UserDTO>> getInactiveUsers() {
        List<UserDTO> inactiveUsers = userService.getInactiveUsers();
        if (inactiveUsers.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(inactiveUsers);
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody UserDTO userDTO) {
        try {
            userService.createUser(userDTO);
            return ResponseEntity.ok("User successfully registered!");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody AuthDTO authDTO) {
        if (userService.authenticate(authDTO)) {
            User user = userService.getByEmail(authDTO.getEmail());
            String token = JwtUtil.generate(user.getEmail(), user.getRole(), user.getName(), Math.toIntExact(user.getId()));
            return ResponseEntity.ok("{\"token\":\"" + token + "\"}");
        } else {
            return ResponseEntity.status(401).body("{\"error\":\"Invalid email or password\"}");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateUser(@PathVariable Long id, @RequestBody UserDTO userDTO) {
        UserDTO updatedUser = userService.updateUser(id, userDTO);
        if (updatedUser == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(updatedUser);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        boolean deleted = userService.deleteUser(id);
        if (!deleted)
            return ResponseEntity.notFound().build();
        return ResponseEntity.noContent().build();
    }
}

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
import java.util.Map;

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
    public ResponseEntity<UserDTO> getUser(@PathVariable Long id,
                                           @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        try {
            UserDTO user = userService.getUserController(id, JwtUtil.getId(token));
            if (user == null)
                return ResponseEntity.notFound().build();
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/plane/{planeId}")
    public ResponseEntity<List<Map<String, Object>>> getUsersByPlaneId(@PathVariable Long planeId) {
        List<Map<String, Object>> users = userService.getUsersByPlaneId(planeId);
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
    public ResponseEntity<UserDTO> updateUser(@PathVariable Long id, @RequestBody UserDTO userDTO,
                                              @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        try {
            UserDTO updatedUser = userService.updateUser(id, userDTO, JwtUtil.getId(token));
            if (updatedUser == null)
                return ResponseEntity.notFound().build();
            return ResponseEntity.ok(updatedUser);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id,
                                           @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        try {
            boolean deleted = userService.deleteUser(id, JwtUtil.getId(token), JwtUtil.getRole(token));
            if (!deleted)
                return ResponseEntity.notFound().build();
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}

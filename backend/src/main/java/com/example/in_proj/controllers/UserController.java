package com.example.in_proj.controllers;

import com.example.in_proj.auth.JwtUtil;
import com.example.in_proj.dto.AuthDTO;
import com.example.in_proj.dto.UserDTO;
import com.example.in_proj.entity.User;
import com.example.in_proj.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping(value = "/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping()
    public ResponseEntity<?> getUser(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");

        Map<String, Object> response = new HashMap<>();
        UserDTO user = userService.getUser(JwtUtil.getId(token));

        if (user == null) {
            response.put("message", "No user with that ID '" + JwtUtil.getId(token) + "' found.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(user);
        }

        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("phoneNumber", user.getPhoneNumber());
        response.put("role", user.getRole());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/flight/{flightId}")
    public ResponseEntity<?> getUsersByFlightId(@PathVariable Long flightId,
                                                @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        try {
            List<Map<String, Object>> users = userService.getUsersByFlightId(flightId, JwtUtil.getId(token));

            if (users.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("message", "No customers were found on the airline with '"
                        + JwtUtil.getId(token) + "' on the flight with ID '" + flightId + "'.");
                ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }

            return ResponseEntity.ok(users);

        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
        }
    }

    @GetMapping("/avia")
    public ResponseEntity<?> getUsersByAviaId(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");

        List<Map<String, Object>> users = userService.getUsersByAviaId(JwtUtil.getId(token));

        if (users.isEmpty()) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", "No customers were found on the airline with '"
                    + JwtUtil.getId(token) + "'.");
            ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }

        return ResponseEntity.ok(users);
    }

    @GetMapping("/out")
    public ResponseEntity<?> getInactiveUsers() {
        List<Map<String, Object>> inactiveUsers = userService.getInactiveUsers();

        if (inactiveUsers.isEmpty()) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", "No inactive clients found.");
            ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }

        return ResponseEntity.ok(inactiveUsers);
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody UserDTO userDTO) {
        try {
            Map<String, Object> user = userService.createUser(userDTO);
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthDTO authDTO) {
        Map<String, Object> response = new HashMap<>();

        if (userService.authenticate(authDTO)) {
            User user = userService.getByEmail(authDTO.getEmail());

            if (user.is_deleted()) {
                response.put("message", "Your account '" + user.getEmail() + "' has been deactivated, please contact the administration.");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }

            String token = JwtUtil.generate(user.getEmail(), user.getRole(), user.getName(), Math.toIntExact(user.getId()));

            response.put("token", token);

            Map<String, Object> userData = new HashMap<>();
            response.put("user", userData);
            userData.put("id", user.getId());
            userData.put("name", user.getName());
            userData.put("email", user.getEmail());
            userData.put("phoneNumber", user.getPhoneNumber());
            userData.put("role", user.getRole());

            return ResponseEntity.ok(response);
        } else {
            response.put("message", "Invalid email or password.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }

    @PutMapping()
    public ResponseEntity<?> updateUser(@RequestBody UserDTO userDTO,
                                        @RequestHeader("Authorization") String authHeader) {
        String oldToken = authHeader.replace("Bearer ", "");
        try {
            Map<String, Object> updatedUser = userService.updateUser(JwtUtil.getId(oldToken), userDTO);

            if (updatedUser == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(updatedUser);
            }

            return ResponseEntity.ok(updatedUser);

        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PutMapping("/delete/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId, @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");

        if (!Objects.equals(userId, JwtUtil.getId(token)) && !Objects.equals("ADMIN", JwtUtil.getRole(token)))
            throw new IllegalArgumentException("User ID does not match");

        Map<String, Object> deletedUser = userService.softDeleteUser(userId);

        return ResponseEntity.status((int) deletedUser.get("status")).body(deletedUser);
    }
}

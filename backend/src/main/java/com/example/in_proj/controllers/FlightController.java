package com.example.in_proj.controllers;

import com.example.in_proj.dto.FlightDTO;
import com.example.in_proj.services.FlightService;
import com.example.in_proj.auth.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(value = "/api/flight")
@RequiredArgsConstructor
public class FlightController {

    private final FlightService flightService;

    @GetMapping
    public ResponseEntity<?> getAllFlights() {
        Map<String, Object> result = flightService.getAllFlightsCombined(null);

        if (result == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "No flights found.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/status")
    public ResponseEntity<?> getFlightsWithUsers() {
        Map<String, Object> result = flightService.getFlightsByStatus();

        if (result == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "No active flights found.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/avia")
    public ResponseEntity<?> getFlightsByAviaId(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");

        Map<String, Object> result = flightService.getFlightsByAviaId(JwtUtil.getId(token));

        if (result == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "No active flights found.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<?> createFlight(@RequestBody FlightDTO flightDTO,
                                          @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        try {
            FlightDTO flight = flightService.createFlight(flightDTO, JwtUtil.getId(token));

            return ResponseEntity.ok(flight);

        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            String message = e.getMessage();

            errorResponse.put("message", message);

            if (message != null && message.toLowerCase().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            } else {
                return ResponseEntity.badRequest().body(errorResponse);
            }
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateFlight(@PathVariable Long id, @RequestBody FlightDTO flightDTO,
                                          @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        try {
            FlightDTO flight = flightService.updateFlight(id, flightDTO, JwtUtil.getId(token), JwtUtil.getRole(token));

            if (flight == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("message", "No flight found with ID '" + id + "'.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }

            return ResponseEntity.ok(flight);

        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            String message = e.getMessage();

            errorResponse.put("message", message);

            if (message != null && message.toLowerCase().contains("not match")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
            } else {
                return ResponseEntity.badRequest().body(errorResponse);
            }
        }
    }

    @PutMapping("/status/{id}")
    public ResponseEntity<?> toggleFlightStatus(@PathVariable Long id,
                                                @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        try {
            Map<String, Object> flight = flightService.statusFlight(id, JwtUtil.getId(token), JwtUtil.getRole(token));

            return ResponseEntity.status((int) flight.get("status")).body(flight);

        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
        }
    }
}

package com.example.in_proj.controllers;

import com.example.in_proj.dto.FlightDTO;
import com.example.in_proj.services.FlightService;
import com.example.in_proj.auth.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "/api/flight")
@RequiredArgsConstructor
public class FlightController {

    private final FlightService flightService;

    @GetMapping
    public ResponseEntity<List<List<?>>> getAllFlights() {
        List<List<?>> result = flightService.getAllFlightsCombined();
        return result.isEmpty() ? ResponseEntity.notFound().build() : ResponseEntity.ok(result);
    }

    @GetMapping("/status")
    public ResponseEntity<List<List<?>>> getFlightsWithUsers() {
        List<List<?>> result = flightService.getFlightsByStatus();
        return result.isEmpty() ? ResponseEntity.notFound().build() : ResponseEntity.ok(result);
    }

    @GetMapping("/avia/{aviaId}")
    public ResponseEntity<List<List<?>>> getFlightsByAviaId(@PathVariable Long aviaId) {
        List<List<?>> result = flightService.getFlightsByAviaId(aviaId);
        return result.isEmpty() ? ResponseEntity.notFound().build() : ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<String> createFlight(@RequestBody FlightDTO flightDTO,
                                                @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        try {
            flightService.createFlight(flightDTO, JwtUtil.getId(token));
            return ResponseEntity.ok("Flight created successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Internal server error: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")//
    public ResponseEntity<FlightDTO> updateFlight(@PathVariable Long id, @RequestBody FlightDTO flightDTO,
                                                @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        try {
            FlightDTO updatedFlightData = flightService.updateFlight(id, flightDTO, JwtUtil.getId(token), JwtUtil.getRole(token));

            if (updatedFlightData == null)
                return ResponseEntity.notFound().build();

            return ResponseEntity.ok(updatedFlightData);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PutMapping("/status/{id}")
    public ResponseEntity<FlightDTO> toggleFlightStatus(@PathVariable Long id,
                                                      @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        try {
            FlightDTO updatedFlight = flightService.statusFlight(id, JwtUtil.getId(token), JwtUtil.getRole(token));

            if (updatedFlight == null)
                return ResponseEntity.notFound().build();

            return ResponseEntity.ok(updatedFlight);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}

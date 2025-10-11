package com.example.in_proj.controllers;

import com.example.in_proj.dto.FlightDTO;
import com.example.in_proj.services.FlightService;
import com.example.in_proj.auth.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping(value = "/api/flight")
@RequiredArgsConstructor
public class FlightController {

    private final FlightService flightService;

    @GetMapping
    public ResponseEntity<List<List<?>>> getAllFlights() {
        List<List<?>> result = flightService.getAllFlightsCombined();
        if (result == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FlightDTO> getFlight(@PathVariable Long id) {
        FlightDTO flight = flightService.getFlight(id);
        if (flight == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(flight);
    }

    @GetMapping("/status")
    public ResponseEntity<List<List<?>>> getFlightsWithUsers() {
        List<List<?>> result = flightService.getFlightsByStatus();
        return result.isEmpty() ? ResponseEntity.notFound().build() : ResponseEntity.ok(result);
    }

    @GetMapping("/avia/{aviaId}")
    public ResponseEntity<List<FlightDTO>> getFlightsByAviaId(@PathVariable Long aviaId) {
        List<FlightDTO> flights = flightService.getFlightsByAviaId(aviaId);
        return flights.isEmpty() ? ResponseEntity.notFound().build() : ResponseEntity.ok(flights);
    }

    @PostMapping
    public ResponseEntity<String> createFlight(@RequestBody FlightDTO flightDTO,
                                                @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        try {
            flightService.createFlight(flightDTO, JwtUtil.getId(token));
            return ResponseEntity.ok("Flight created successfully");
        } catch (Exception e) {
            // На випадок інших помилок
            return ResponseEntity.status(500).body("Internal server error: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
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

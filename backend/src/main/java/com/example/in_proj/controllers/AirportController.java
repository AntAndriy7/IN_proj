package com.example.in_proj.controllers;

import com.example.in_proj.dto.AirportDTO;
import com.example.in_proj.services.AirportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/airport")
@RequiredArgsConstructor
public class AirportController {

    private final AirportService airportService;

    @GetMapping
    public ResponseEntity<?> getAllAirports() {
        List<AirportDTO> airports = airportService.getAllAirports();

        if (airports.isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "No airports found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        return ResponseEntity.ok(airports);
    }

    @PostMapping
    public ResponseEntity<?> createAirport(@RequestBody AirportDTO airportDTO) {
        try {
            AirportDTO created = airportService.createAirport(airportDTO);

            if (created == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("message", "Airport could not be created");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            return ResponseEntity.status(HttpStatus.CREATED).body(created);

        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}

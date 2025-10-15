package com.example.in_proj.controllers;

import com.example.in_proj.dto.AirportDTO;
import com.example.in_proj.services.AirportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/airport")
@RequiredArgsConstructor
public class AirportController {

    private final AirportService airportService;

    @GetMapping
    public ResponseEntity<?> getAllAirports() {
        List<AirportDTO> airports = airportService.getAllAirports();
        return airports.isEmpty() ? ResponseEntity.status(HttpStatus.NOT_FOUND).body("No airports found")
                : ResponseEntity.ok(airports);
    }
}

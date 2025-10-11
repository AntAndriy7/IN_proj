package com.example.in_proj.controllers;

import com.example.in_proj.dto.AirportDTO;
import com.example.in_proj.services.AirportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/airport")
@RequiredArgsConstructor
public class AirportController {

    private final AirportService airportService;

    @GetMapping
    public ResponseEntity<List<AirportDTO>> getAllAirports() {
        return ResponseEntity.ok(airportService.getAllAirports());
    }
}

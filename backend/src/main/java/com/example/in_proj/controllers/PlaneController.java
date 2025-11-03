package com.example.in_proj.controllers;

import com.example.in_proj.dto.OpenSkyPlaneDTO;
import com.example.in_proj.dto.PlaneDTO;
import com.example.in_proj.services.PlaneService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(value = "/api/plane")
@RequiredArgsConstructor
public class PlaneController {

    private final PlaneService planeService;

    @GetMapping
    public ResponseEntity<?> getAllPlanes() {
        List<PlaneDTO> planes = planeService.getAllPlanes();

        if (planes.isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "No planes found");
            return ResponseEntity.status(HttpStatus.NO_CONTENT).body(response);
        }

        return ResponseEntity.ok(planes);
    }

    @GetMapping("/opensky")
    public ResponseEntity<?> getPlanesFromOpenSky() {
        List<OpenSkyPlaneDTO> planes = planeService.getPlanesFromOpenSky();

        if (planes.isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "No planes available from OpenSky");
            return ResponseEntity.status(HttpStatus.NO_CONTENT).body(response);
        }

        return ResponseEntity.ok(planes);
    }

    @PostMapping
    public ResponseEntity<?> createPlane(@RequestBody PlaneDTO planeDTO) {
        try {
            PlaneDTO plane = planeService.createPlane(planeDTO);

            if (plane == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("message", "Plane could not be created");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            return ResponseEntity.status(HttpStatus.CREATED).body(plane);

        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}

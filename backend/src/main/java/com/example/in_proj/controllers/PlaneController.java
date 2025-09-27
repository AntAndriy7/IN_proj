package com.example.in_proj.controllers;

import com.example.in_proj.dto.PlaneDTO;
import com.example.in_proj.services.PlaneService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "/api/plane")
@RequiredArgsConstructor
public class PlaneController {

    private final PlaneService planeService;

    @GetMapping
    public ResponseEntity<List<PlaneDTO>> getAllPlanes() {
        List<PlaneDTO> planes = planeService.getAllPlanes();
        return ResponseEntity.ok(planes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlaneDTO> getPlane(@PathVariable Long id) {
        PlaneDTO plane = planeService.getPlane(id);
        if (plane == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(plane);
    }

    @GetMapping("/status")
    public ResponseEntity<List<PlaneDTO>> getPlanesByStatus() {
        List<PlaneDTO> planes = planeService.getPlanesByStatus();
        return planes.isEmpty() ? ResponseEntity.notFound().build() : ResponseEntity.ok(planes);
    }

    @GetMapping("/avia/{aviaId}")
    public ResponseEntity<List<PlaneDTO>> getPlanesByAviaId(@PathVariable Long aviaId) {
        List<PlaneDTO> planes = planeService.getPlanesByAviaId(aviaId);
        return planes.isEmpty() ? ResponseEntity.notFound().build() : ResponseEntity.ok(planes);
    }

    @PostMapping
    public ResponseEntity<PlaneDTO> createPlane(@RequestBody PlaneDTO planeDTO) {
        PlaneDTO createdPlane = planeService.createPlane(planeDTO);
        return ResponseEntity.ok(createdPlane);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlaneDTO> updatePlane(@PathVariable Long id, @RequestBody PlaneDTO planeDTO) {
        PlaneDTO updatedPlaneData = planeService.updatePlane(id, planeDTO);
        if (updatedPlaneData == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(updatedPlaneData);
    }
}


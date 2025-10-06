package com.example.in_proj.controllers;

import com.example.in_proj.dto.PlaneDTO;
import com.example.in_proj.services.PlaneService;
import com.example.in_proj.auth.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping(value = "/api/plane")
@RequiredArgsConstructor
public class PlaneController {

    private final PlaneService planeService;

    @GetMapping
    public ResponseEntity<List<List<?>>> getAllPlanes() {
        List<List<?>> result = planeService.getAllPlanesCombined();
        if (result == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlaneDTO> getPlane(@PathVariable Long id) {
        PlaneDTO plane = planeService.getPlane(id);
        if (plane == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(plane);
    }

    @GetMapping("/status")
    public ResponseEntity<List<List<?>>> getPlanesWithUsers() {
        List<List<?>> result = planeService.getPlanesByStatus();
        return result.isEmpty() ? ResponseEntity.notFound().build() : ResponseEntity.ok(result);
    }

    @GetMapping("/avia/{aviaId}")
    public ResponseEntity<List<PlaneDTO>> getPlanesByAviaId(@PathVariable Long aviaId) {
        List<PlaneDTO> planes = planeService.getPlanesByAviaId(aviaId);
        return planes.isEmpty() ? ResponseEntity.notFound().build() : ResponseEntity.ok(planes);
    }

    @PostMapping
    public ResponseEntity<PlaneDTO> createPlane(@RequestBody PlaneDTO planeDTO,
                                                @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        try {
            PlaneDTO createdPlane = planeService.createPlane(planeDTO, JwtUtil.getId(token));
            return ResponseEntity.ok(createdPlane);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlaneDTO> updatePlane(@PathVariable Long id, @RequestBody PlaneDTO planeDTO,
                                                @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        try {
            PlaneDTO updatedPlaneData = planeService.updatePlane(id, planeDTO, JwtUtil.getId(token), JwtUtil.getRole(token));

            if (updatedPlaneData == null)
                return ResponseEntity.notFound().build();

            return ResponseEntity.ok(updatedPlaneData);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PutMapping("/status/{id}")
    public ResponseEntity<PlaneDTO> togglePlaneStatus(@PathVariable Long id,
                                                      @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        try {
            PlaneDTO updatedPlane = planeService.statusPlane(id, JwtUtil.getId(token), JwtUtil.getRole(token));

            if (updatedPlane == null)
                return ResponseEntity.notFound().build();

            return ResponseEntity.ok(updatedPlane);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}

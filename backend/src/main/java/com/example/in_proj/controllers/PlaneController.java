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
}

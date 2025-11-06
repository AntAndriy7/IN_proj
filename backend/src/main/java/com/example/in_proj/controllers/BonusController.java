package com.example.in_proj.controllers;

import com.example.in_proj.auth.JwtUtil;
import com.example.in_proj.dto.BonusDTO;
import com.example.in_proj.services.BonusService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bonus")
@RequiredArgsConstructor
public class BonusController {
    private final BonusService bonusService;

    @GetMapping("/client")
    public ResponseEntity<?> getAllBonusesByClient(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");

        Map<String, Object> result = bonusService.getAllBonusesWithAvia(JwtUtil.getId(token));

        if (result == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "No bonuses found.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/client/avia/{aviaId}")
    public ResponseEntity<?> getBonusByAviaId(@PathVariable Long aviaId,
                                              @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");

        BonusDTO bonus = bonusService.getBonusByAviaId(JwtUtil.getId(token), aviaId);

        if (bonus == null) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", "No bonuses found.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }

        return ResponseEntity.ok(bonus);
    }

    @PutMapping
    public ResponseEntity<?> updateBonus(@RequestBody BonusDTO bonusDTO,
                                         @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");

        try {
            BonusDTO updatedBonus = bonusService.updateBonus(JwtUtil.getId(token), bonusDTO);

            return ResponseEntity.ok(updatedBonus);

        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}

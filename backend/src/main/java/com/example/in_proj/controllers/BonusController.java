package com.example.in_proj.controllers;

import com.example.in_proj.auth.JwtUtil;
import com.example.in_proj.dto.BonusDTO;
import com.example.in_proj.services.BonusService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/bonus")
@RequiredArgsConstructor
public class BonusController {
    private final BonusService bonusService;

    @GetMapping("/client/{clientId}")
    public ResponseEntity<?> getAllBonusesByClient(@PathVariable Long clientId,
                                                               @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        try {
            if (!Objects.equals(clientId, JwtUtil.getId(token)))
                throw new IllegalArgumentException("User ID does not match");

            List<List<?>> result = bonusService.getAllBonusesWithAvia(clientId);

            if (result == null || result.isEmpty())
                return ResponseEntity.notFound().build();

            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    @GetMapping("/client/{clientId}/avia/{aviaId}")
    public ResponseEntity<?> getBonusErrorByClientAndAvia(
            @PathVariable Long clientId, @PathVariable Long aviaId,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        try {
            if (!Objects.equals(clientId, JwtUtil.getId(token)))
                throw new IllegalArgumentException("User ID does not match");

            BonusDTO bonus = bonusService.getBonusByClientAndAvia(clientId, aviaId);

            if (bonus == null)
                return ResponseEntity.notFound().build();

            return ResponseEntity.ok(bonus);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    @PutMapping
    public ResponseEntity<?> upsertBonus(@RequestBody BonusDTO bonusDTO,
                                                @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        try {
            if (!Objects.equals(bonusDTO.getAvia_id(), JwtUtil.getId(token)))
                throw new IllegalArgumentException("User ID does not match");

            BonusDTO updatedBonus = bonusService.upsertBonus(bonusDTO);

            if (updatedBonus == null)
                return ResponseEntity.notFound().build();

            return ResponseEntity.ok(updatedBonus);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

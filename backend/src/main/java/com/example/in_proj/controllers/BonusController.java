package com.example.in_proj.controllers;

import com.example.in_proj.dto.BonusDTO;
import com.example.in_proj.services.BonusService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bonus")
@RequiredArgsConstructor
public class BonusController {
    private final BonusService bonusService;

    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<List<?>>> getAllBonusesByClient(@PathVariable Long clientId) {
        List<List<?>> result = bonusService.getAllBonusesWithAvia(clientId);
        if (result == null || result.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/client/{clientId}/avia/{aviaId}")
    public ResponseEntity<BonusDTO> getBonusErrorByClientAndAvia(
            @PathVariable Long clientId, @PathVariable Long aviaId) {
        BonusDTO bonus = bonusService.getBonusByClientAndAvia(clientId, aviaId);
        if (bonus == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(bonus);
    }

    @PutMapping
    public ResponseEntity<BonusDTO> upsertBonus(@RequestBody BonusDTO bonusDTO) {
        BonusDTO updatedBonus = bonusService.upsertBonus(bonusDTO);
        if (updatedBonus == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updatedBonus);
    }
}

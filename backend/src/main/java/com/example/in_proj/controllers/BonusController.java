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
    public ResponseEntity<List<BonusDTO>> getAllBonusesByClient(@PathVariable Long clientId) {
        List<BonusDTO> bonuses = bonusService.getAllBonusesByClient(clientId);
        if (bonuses.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(bonuses);
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

    @PostMapping
    public ResponseEntity<BonusDTO> createBonus(@RequestBody BonusDTO bonusDTO) {
        BonusDTO createdBonus = bonusService.createBonus(bonusDTO);
        return ResponseEntity.ok(createdBonus);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BonusDTO> updateBonus(@PathVariable Long id, @RequestBody BonusDTO bonusDTO) {
        BonusDTO updatedBonus = bonusService.updateBonus(id, bonusDTO);
        System.out.println(updatedBonus);
        if (updatedBonus == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updatedBonus);
    }
}

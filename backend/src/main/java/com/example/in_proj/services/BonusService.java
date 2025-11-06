package com.example.in_proj.services;

import com.example.in_proj.dto.BonusDTO;
import com.example.in_proj.entity.Bonus;
import com.example.in_proj.mapper.BonusMapper;
import com.example.in_proj.repository.BonusRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BonusService {
    private final BonusRepository bonusRepository;
    private final UserService userService;
    private final BonusMapper mapper = BonusMapper.INSTANCE;

    public BonusDTO getBonusByAviaId(Long clientId, Long aviaId) {
        Bonus bonus = bonusRepository.findByUserIdAndAviaId(clientId, aviaId);
        return bonus != null ? mapper.toDTO(bonus) : null;
    }

    public BonusDTO updateBonus(Long aviaId, BonusDTO bonusDTO) {
        bonusDTO.setAvia_id(aviaId);
        Bonus existing = bonusRepository.findByUserIdAndAviaId(bonusDTO.getClient_id(), aviaId);

        printAviaCompanyIds(getAllBonusesWithAvia(bonusDTO.getClient_id()));

        if (bonusDTO.getBonus_count() <= 0)
            throw new IllegalArgumentException("Not allowed to accrue negative or zero bonuses.");

        Bonus bonus;
        if (existing != null) {
            existing.setBonus_count(existing.getBonus_count() + bonusDTO.getBonus_count());
            bonus = existing;
        } else {
            bonus = mapper.toEntity(bonusDTO);
        }

        Bonus saved = bonusRepository.save(bonus);
        return mapper.toDTO(saved);
    }

    public void printAviaCompanyIds(Map<String, Object> bonusesWithAvia) {
        if (bonusesWithAvia == null || !bonusesWithAvia.containsKey("avia_companies")) {
            System.out.println("No 'avia_companies' key found or map is null.");
            return;
        }

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> aviaCompanies = (List<Map<String, Object>>) bonusesWithAvia.get("avia_companies");

        if (aviaCompanies == null || aviaCompanies.isEmpty()) {
            System.out.println("No avia companies found.");
            return;
        }

        System.out.println("=== Avia Company IDs ===");
        for (Map<String, Object> avia : aviaCompanies) {
            Object idObj = avia.get("id");
            if (idObj instanceof Number) {
                long id = ((Number) idObj).longValue();
                System.out.println("ID: " + id);
            } else {
                System.out.println("Invalid or missing ID: " + idObj);
            }
        }
    }

    public Map<String, Object> getAllBonusesWithAvia(Long clientId) {
        List<Bonus> bonuses = bonusRepository.findAllByClientId(clientId);

        if (bonuses.isEmpty()) {
            Map<String, Object> emptyResponse = new HashMap<>();
            emptyResponse.put("bonuses", Collections.emptyList());
            emptyResponse.put("avia_companies", Collections.emptyList());
            return emptyResponse;
        }

        List<BonusDTO> bonusDTOs = bonuses.stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());

        Set<Long> aviaIds = bonuses.stream()
                .map(Bonus::getAvia_id)
                .collect(Collectors.toSet());

        List<Map<String, Object>> aviaCompanies = aviaIds.stream()
                .map(userService::getUser)
                .filter(Objects::nonNull)
                .map(user -> {
                    Map<String, Object> minimalUser = new HashMap<>();
                    minimalUser.put("id", user.getId());
                    minimalUser.put("name", user.getName());
                    return minimalUser;
                })
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("bonuses", bonusDTOs);
        response.put("avia_companies", aviaCompanies);

        return response;
    }

}

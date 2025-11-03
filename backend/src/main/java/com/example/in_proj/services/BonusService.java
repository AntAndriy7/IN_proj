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

    public BonusDTO getBonusByClientAndAvia(Long clientId, Long aviaId) {
        Bonus bonus = bonusRepository.findByUserIdAndAviaId(clientId, aviaId);
        return bonus != null ? mapper.toDTO(bonus) : null;
    }

    public BonusDTO upsertBonus(BonusDTO bonusDTO) {
        Bonus existing = bonusRepository.findByUserIdAndAviaId(bonusDTO.getClient_id(), bonusDTO.getAvia_id());

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

    public List<List<?>> getAllBonusesWithAvia(Long clientId) {
        List<Bonus> bonuses = bonusRepository.findAllByClientId(clientId);
        if (bonuses.isEmpty()) {
            return Collections.emptyList();
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

        List<List<?>> combined = new ArrayList<>();
        combined.add(bonusDTOs);
        combined.add(aviaCompanies);
        return combined;
    }
}

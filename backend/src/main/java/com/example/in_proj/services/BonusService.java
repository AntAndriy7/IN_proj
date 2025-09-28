package com.example.in_proj.services;

import com.example.in_proj.dto.BonusDTO;
import com.example.in_proj.entity.Bonus;
import com.example.in_proj.mapper.BonusMapper;
import com.example.in_proj.repository.BonusRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BonusService {
    private final BonusRepository bonusRepository;
    private final BonusMapper mapper = BonusMapper.INSTANCE;

    public List<BonusDTO> getAllBonusesByClient(Long clientId) {
        return bonusRepository.findAllByClientId(clientId).stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    public BonusDTO getBonusByClientAndAvia(Long clientId, Long aviaId) {
        return bonusRepository.findAll().stream()
                .filter(bonus -> bonus.getClient_id() == clientId && bonus.getAvia_id() == aviaId)
                .map(mapper::toDTO).findFirst().orElse(null);
    }

    public BonusDTO createBonus(BonusDTO bonusDTO) {
        Bonus bonus = mapper.toEntity(bonusDTO);
        return mapper.toDTO(bonusRepository.save(bonus));
    }

    public BonusDTO updateBonus(Long id, BonusDTO bonusDTO) {
        return bonusRepository.findById(id).map(existingBonus -> {
            if (bonusDTO.getClient_id() != 0) {
                existingBonus.setClient_id(bonusDTO.getClient_id());
            }
            if (bonusDTO.getAvia_id() != 0) {
                existingBonus.setAvia_id(bonusDTO.getAvia_id());
            }
            if (bonusDTO.getBonus_count() != 0) {
                existingBonus.setBonus_count(bonusDTO.getBonus_count());
            }
            bonusRepository.save(existingBonus);
            return mapper.toDTO(existingBonus);
        }).orElse(null);
    }
}

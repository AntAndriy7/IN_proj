package com.example.in_proj.mapper;

import com.example.in_proj.dto.BonusDTO;
import com.example.in_proj.entity.Bonus;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

@Mapper
public interface BonusMapper {
    BonusMapper INSTANCE = Mappers.getMapper(BonusMapper.class);

    BonusDTO toDTO(Bonus bonus);
    Bonus toEntity(BonusDTO bonusDTO);
}

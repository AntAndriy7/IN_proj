package com.example.in_proj.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

@Mapper
public interface BonusMapper {
    BonusMapper INSTANCE = Mappers.getMapper(BonusMapper.class);
}

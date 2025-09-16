package com.example.in_proj.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

@Mapper
public interface PlaneMapper {
    PlaneMapper INSTANCE = Mappers.getMapper(PlaneMapper.class);
}

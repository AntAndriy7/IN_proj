package com.example.in_proj.mapper;

import com.example.in_proj.dto.PlaneDTO;
import com.example.in_proj.entity.Plane;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

@Mapper
public interface PlaneMapper {
    PlaneMapper INSTANCE = Mappers.getMapper(PlaneMapper.class);

    PlaneDTO toDTO(Plane plane);
    Plane toEntity(PlaneDTO planeDTO);
}

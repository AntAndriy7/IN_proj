package com.example.in_proj.mapper;

import com.example.in_proj.dto.AirportDTO;
import com.example.in_proj.entity.Airport;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

@Mapper
public interface AirportMapper {
    AirportMapper INSTANCE = Mappers.getMapper(AirportMapper.class);

    AirportDTO toDTO(Airport airport);
    Airport toEntity(AirportDTO airportDTO);
}

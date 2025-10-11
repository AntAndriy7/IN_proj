package com.example.in_proj.mapper;

import com.example.in_proj.dto.FlightDTO;
import com.example.in_proj.entity.Flight;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

@Mapper
public interface FlightMapper {
    FlightMapper INSTANCE = Mappers.getMapper(FlightMapper.class);

    FlightDTO toDTO(Flight flight);
    Flight toEntity(FlightDTO flightDTO);
}

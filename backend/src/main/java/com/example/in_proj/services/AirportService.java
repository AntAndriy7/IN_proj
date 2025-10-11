package com.example.in_proj.services;

import com.example.in_proj.dto.AirportDTO;
import com.example.in_proj.mapper.AirportMapper;
import com.example.in_proj.repository.AirportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AirportService {

    private final AirportRepository airportRepository;
    private final AirportMapper mapper = AirportMapper.INSTANCE;

    public List<AirportDTO> getAllAirports() {
        return airportRepository.findAll().stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }
}
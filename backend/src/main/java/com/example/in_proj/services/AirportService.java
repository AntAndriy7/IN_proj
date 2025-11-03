package com.example.in_proj.services;

import com.example.in_proj.dto.AirportDTO;
import com.example.in_proj.entity.Airport;
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

    public AirportDTO getAirport(Long id) {
        return airportRepository.findById(id)
                .map(mapper::toDTO)
                .orElse(null);
    }

    public List<AirportDTO> getAllAirports() {
        return airportRepository.findAll().stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    public AirportDTO createAirport(AirportDTO airportDTO) {
        String name = airportDTO.getName();
        String city = airportDTO.getCity();
        String code = airportDTO.getCode();
        String country = airportDTO.getCountry();

        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Airport name cannot be empty.");
        }
        if (city == null || city.isBlank()) {
            throw new IllegalArgumentException("City name cannot be empty.");
        }
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("Airport code cannot be empty.");
        }
        if (country == null || country.isBlank()) {
            throw new IllegalArgumentException("Country name cannot be empty.");
        }

        if (containsHtml(name)) {
            throw new IllegalArgumentException("Airport name cannot contain HTML tags.");
        }
        if (containsHtml(city)) {
            throw new IllegalArgumentException("City name cannot contain HTML tags.");
        }
        if (containsHtml(code)) {
            throw new IllegalArgumentException("Airport code cannot contain HTML tags.");
        }
        if (containsHtml(country)) {
            throw new IllegalArgumentException("Country name cannot contain HTML tags.");
        }

        if (containsDigits(name)) {
            throw new IllegalArgumentException("Airport name cannot contain digits.");
        }
        if (containsDigits(city)) {
            throw new IllegalArgumentException("City name cannot contain digits.");
        }
        if (containsDigits(code)) {
            throw new IllegalArgumentException("Code name cannot contain digits.");
        }
        if (containsDigits(country)) {
            throw new IllegalArgumentException("Country name cannot contain digits.");
        }

        if (airportRepository.findByName(name) != null) {
            throw new IllegalArgumentException("Airport with name '" + name + "' already exists.");
        }
        if (airportRepository.findByCode(code) != null) {
            throw new IllegalArgumentException("Airport with code '" + code + "' already exists.");
        }

        Airport airport = mapper.toEntity(airportDTO);
        airport = airportRepository.save(airport);

        return mapper.toDTO(airport);
    }

    private boolean containsHtml(String input) {
        return input != null && input.matches(".*<[^>]+>.*");
    }

    private boolean containsDigits(String input) {
        return input != null && input.matches(".*\\d.*");
    }
}
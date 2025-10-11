package com.example.in_proj.services;

import com.example.in_proj.dto.PlaneDTO;
import com.example.in_proj.mapper.PlaneMapper;
import com.example.in_proj.repository.PlaneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlaneService {

    private final PlaneRepository planeRepository;
    private final PlaneMapper mapper = PlaneMapper.INSTANCE;

    public List<PlaneDTO> getAllPlanes() {
        return planeRepository.findAll().stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }
}

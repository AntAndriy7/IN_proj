package com.example.in_proj.services;

import com.example.in_proj.dto.OpenSkyPlaneDTO;
import com.example.in_proj.dto.PlaneDTO;
import com.example.in_proj.entity.Plane;
import com.example.in_proj.mapper.PlaneMapper;
import com.example.in_proj.repository.PlaneRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlaneService {

    private final PlaneRepository planeRepository;
    private final PlaneMapper mapper = PlaneMapper.INSTANCE;

    private static final String OPENSKY_URL = "https://opensky-network.org/api/states/all";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private long lastFetchTime = 0;
    private List<OpenSkyPlaneDTO> cachedPlanes = Collections.emptyList();

    public PlaneDTO getPlane(Long id) {
        return planeRepository.findById(id)
                .map(mapper::toDTO)
                .orElse(null);
    }

    public List<PlaneDTO> getAllPlanes() {
        return planeRepository.findAll().stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<OpenSkyPlaneDTO> getPlanesFromOpenSky() {
        long now = System.currentTimeMillis();

        // Якщо кеш пустий або минуло більше 60 секунд - новий запит
        if (cachedPlanes.isEmpty() || (now - lastFetchTime) > 60_000) {
            try {
                String response = restTemplate.getForObject(OPENSKY_URL, String.class);
                JsonNode states = objectMapper.readTree(response).get("states");

                List<OpenSkyPlaneDTO> planes = new ArrayList<>();

                if (states != null && states.isArray()) {
                    for (JsonNode state : states) {
                        if (!state.get(8).asBoolean() && (state.get(9).asDouble() > 65)) {
                            OpenSkyPlaneDTO plane = new OpenSkyPlaneDTO();
                            plane.setIcao24(state.get(0).asText(null));
                            plane.setCallsign(state.get(1).asText(null));
                            plane.setOriginCountry(state.get(2).asText(null));
                            plane.setLongitude(state.get(5).isNull() ? null : state.get(5).asDouble());
                            plane.setLatitude(state.get(6).isNull() ? null : state.get(6).asDouble());
                            plane.setAltitude(state.get(7).isNull() ? null : state.get(7).asDouble());
                            plane.setVelocity(state.get(9).isNull() ? null : state.get(9).asDouble());
                            plane.setHeading(state.get(10).isNull() ? null : state.get(10).asDouble());

                            planes.add(plane);
                        }
                    }
                }

                // Оновлюємо кеш
                cachedPlanes = planes;
                lastFetchTime = now;

            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        return cachedPlanes;
    }

    public PlaneDTO createPlane(PlaneDTO planeDTO) {
        String model = planeDTO.getModel();
        Long seats_number = planeDTO.getSeats_number();

        if(model == null || model.isBlank()) {
            throw new IllegalArgumentException("Model name cannot be empty.");
        }

        if (containsHtml(model)) {
            throw new IllegalArgumentException("Model name cannot contain HTML tags.");
        }

        if (seats_number <= 10 || seats_number >= 860) {
            throw new IllegalArgumentException("Number of seats must be in the range 10-860.");
        }

        if (planeRepository.findByModel(planeDTO.getModel()) != null) {
            throw new IllegalArgumentException("Plane with model '" + planeDTO.getModel() + "' already exists.");
        }

        Plane plane = mapper.toEntity(planeDTO);
        plane = planeRepository.save(plane);

        return mapper.toDTO(plane);
    }

    private boolean containsHtml(String input) {
        return input != null && input.matches(".*<[^>]+>.*");
    }
}

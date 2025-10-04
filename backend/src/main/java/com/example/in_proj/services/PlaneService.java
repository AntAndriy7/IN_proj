package com.example.in_proj.services;

import com.example.in_proj.dto.PlaneDTO;
import com.example.in_proj.entity.Order;
import com.example.in_proj.entity.Plane;
import com.example.in_proj.mapper.PlaneMapper;
import com.example.in_proj.repository.OrderRepository;
import com.example.in_proj.repository.PlaneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.sql.Time;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlaneService {

    private final UserService userService;
    private final OrderService orderService;
    private final PlaneRepository planeRepository;
    private final OrderRepository orderRepository;
    private final PlaneMapper mapper = PlaneMapper.INSTANCE;

    public PlaneDTO getPlane(Long id) {
        return planeRepository.findById(id)
                .map(mapper::toDTO)
                .orElse(null);
    }

    public List<List<?>> getAllPlanes() {
        checkAndUpdatePlaneStatuses();

        List<Plane> planes = planeRepository.findAll();
        List<PlaneDTO> planeDTOs = planes.stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());

        Set<Long> aviaIds = planes.stream()
                .map(Plane::getAvia_id)
                .collect(Collectors.toSet());

        List<Map<String, Object>> users = aviaIds.stream()
                .map(userService::getUser)
                .filter(Objects::nonNull)
                .map(user -> {
                    Map<String, Object> minimalUser = new HashMap<>();
                    minimalUser.put("id", user.getId());
                    minimalUser.put("name", user.getName());
                    return minimalUser;
                })
                .collect(Collectors.toList());

        List<List<?>> combined = new ArrayList<>();
        combined.add(planeDTOs);
        combined.add(users);
        return combined;
    }

    public List<List<?>> getPlanesByStatus() {
        checkAndUpdatePlaneStatuses();

        List<Plane> planes = planeRepository.findByStatus(true);
        List<PlaneDTO> planeDTOs = planes.stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());

        Set<Long> aviaIds = planes.stream()
                .map(Plane::getAvia_id)
                .collect(Collectors.toSet());

        List<Map<String, Object>> users = aviaIds.stream()
                .map(userService::getUser)
                .filter(Objects::nonNull)
                .map(user -> {
                    Map<String, Object> minimalUser = new HashMap<>();
                    minimalUser.put("id", user.getId());
                    minimalUser.put("name", user.getName());
                    return minimalUser;
                })
                .collect(Collectors.toList());

        List<List<?>> combined = new ArrayList<>();
        combined.add(planeDTOs);
        combined.add(users);
        return combined;
    }

    private void checkAndUpdatePlaneStatuses() {
        List<Plane> planes = planeRepository.findAll();
        Date currentDate = new Date(System.currentTimeMillis());
        Time currentTime = new Time(System.currentTimeMillis());

        for (Plane plane : planes) {
            // Якщо дата і час вильоту вже минули, оновлюємо статус на false
            if ((plane.getDeparture_date().before(currentDate)) ||
                    (plane.getDeparture_date().equals(currentDate) && plane.getDeparture_time().before(currentTime))) {
                if (plane.isStatus()) { // Оновлюємо тільки якщо статус ще true
                    plane.setStatus(false);
                    planeRepository.save(plane);
                }
            }
        }
    }

    public List<PlaneDTO> getPlanesByAviaId(Long aviaId) {
        return planeRepository.findByAviaId(aviaId).stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    public PlaneDTO createPlane(PlaneDTO planeDTO, Long userIdFromToken) {
        if (!Objects.equals(planeDTO.getAvia_id(), userIdFromToken)) {
            throw new IllegalArgumentException("User ID does not match avia_id");
        }

        LocalDate departureDate = planeDTO.getDeparture_date().toLocalDate();
        LocalDate arrivalDate = planeDTO.getArrival_date().toLocalDate();
        LocalTime departureTime = planeDTO.getDeparture_time().toLocalTime();
        LocalTime arrivalTime = planeDTO.getArrival_time().toLocalTime();

        LocalDateTime departureDateTime = LocalDateTime.of(departureDate, departureTime);
        LocalDateTime arrivalDateTime = LocalDateTime.of(arrivalDate, arrivalTime);
        LocalDateTime now = LocalDateTime.now();

        LocalDateTime maxAllowedDeparture = now.plusHours(24);
        if (departureDateTime.isAfter(maxAllowedDeparture)) {
            throw new IllegalArgumentException("Departure date/time cannot be later than 24 hours from now");
        }

        if (arrivalDateTime.isBefore(departureDateTime)) {
            throw new IllegalArgumentException("Arrival date/time cannot be before departure date/time");
        }

        Duration flightDuration = Duration.between(departureDateTime, arrivalDateTime);
        if (flightDuration.toHours() > 24) {
            throw new IllegalArgumentException("Flight duration cannot exceed 24 hours");
        }

        Plane plane = mapper.toEntity(planeDTO);

        plane.setStatus(true);
        plane.setOccupied_seats(0);

        plane = planeRepository.save(plane);
        return mapper.toDTO(plane);
    }

    public PlaneDTO updatePlane(Long id, PlaneDTO planeDTO) {
        return planeRepository.findById(id).map(existingPlane -> {
            if (planeDTO.getAvia_id() != 0) {
                existingPlane.setAvia_id(planeDTO.getAvia_id());
            }
            if (planeDTO.getPlane_number() != null) {
                existingPlane.setPlane_number(planeDTO.getPlane_number());
            }
            if (planeDTO.getDeparture() != null) {
                existingPlane.setDeparture(planeDTO.getDeparture());
            }
            if (planeDTO.getDestination() != null) {
                existingPlane.setDestination(planeDTO.getDestination());
            }
            if (planeDTO.getDeparture_time() != null) {
                existingPlane.setDeparture_time(planeDTO.getDeparture_time());
            }
            if (planeDTO.getArrival_time() != null) {
                existingPlane.setArrival_time(planeDTO.getArrival_time());
            }
            if (planeDTO.getDeparture_date() != null) {
                existingPlane.setDeparture_date(planeDTO.getDeparture_date());
            }
            if (planeDTO.getArrival_date() != null) {
                existingPlane.setArrival_date(planeDTO.getArrival_date());
            }
            if (planeDTO.getTicket_price() != 0) {
                existingPlane.setTicket_price(planeDTO.getTicket_price());
            }
            if (planeDTO.getSeats() != 0) {
                existingPlane.setSeats(planeDTO.getSeats());
            }
            if (planeDTO.getOccupied_seats() != 0) {
                existingPlane.setOccupied_seats(planeDTO.getOccupied_seats());
            }
            planeRepository.save(existingPlane);
            return mapper.toDTO(existingPlane);
        }).orElse(null);
    }

    public PlaneDTO statusPlane(Long id) {
        return planeRepository.findById(id).map(existingPlane -> {
            // Змінюємо статус літака
            existingPlane.setStatus(false);
            planeRepository.save(existingPlane);

            // Отримуємо список замовлень по літаку
            List<Order> orders = orderRepository.findByPlane_id(id);

            for (Order order : orders) {
                orderService.processOrder(order, 2);
            }

            return mapper.toDTO(existingPlane);
        }).orElse(null);
    }
}

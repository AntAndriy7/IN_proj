package com.example.in_proj.services;

import com.example.in_proj.auth.JwtUtil;
import com.example.in_proj.dto.FlightDTO;
import com.example.in_proj.entity.Bonus;
import com.example.in_proj.entity.Order;
import com.example.in_proj.entity.Flight;
import com.example.in_proj.mapper.FlightMapper;
import com.example.in_proj.repository.BonusRepository;
import com.example.in_proj.repository.OrderRepository;
import com.example.in_proj.repository.FlightRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.sql.Time;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FlightService {

    private final UserService userService;
    private final FlightRepository flightRepository;
    private final OrderRepository orderRepository;
    private final BonusRepository bonusRepository;
    private final FlightMapper mapper = FlightMapper.INSTANCE;

    public FlightDTO getFlight(Long id) {
        return flightRepository.findById(id)
                .map(mapper::toDTO)
                .orElse(null);
    }

    public List<FlightDTO> getAllFlights(Set<Long> flightIds) {
        List<Flight> flights;

        if (flightIds == null || flightIds.isEmpty()) {
            flights = flightRepository.findAll(); // повертаємо всі літаки
        } else {
            flights = flightRepository.findAllById(flightIds); // літаки за ID
        }

        return flights.stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getAvia(Set<Long> aviaIds) {
        return aviaIds.stream()
                .map(userService::getUser)       // отримуємо користувача по aviaId
                .filter(Objects::nonNull)        // відкидаємо null
                .map(user -> {                   // мінімальні дані
                    Map<String, Object> minimalUser = new HashMap<>();
                    minimalUser.put("id", user.getId());
                    minimalUser.put("name", user.getName());
                    return minimalUser;
                })
                .collect(Collectors.toList());
    }

    public List<List<?>> getAllFlightsCombined() {
        checkAndUpdateFlightStatuses();

        List<Flight> flights = flightRepository.findAll();
        List<FlightDTO> flightDTOs = getAllFlights(null);

        Set<Long> aviaIds = flights.stream()
                .map(Flight::getAvia_id)
                .collect(Collectors.toSet());

        List<Map<String, Object>> users = getAvia(aviaIds);

        List<List<?>> combined = new ArrayList<>();
        combined.add(flightDTOs);
        combined.add(users);
        return combined;
    }

    public List<List<?>> getFlightsByStatus() {
        checkAndUpdateFlightStatuses();

        List<Flight> flights = flightRepository.findByStatus(true);
        List<FlightDTO> flightDTOs = flights.stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());

        Set<Long> aviaIds = flights.stream()
                .map(Flight::getAvia_id)
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
        combined.add(flightDTOs);
        combined.add(users);
        return combined;
    }

    private void checkAndUpdateFlightStatuses() {
        List<Flight> flights = flightRepository.findAll();
        Date currentDate = new Date(System.currentTimeMillis());
        Time currentTime = new Time(System.currentTimeMillis());

        for (Flight flight : flights) {
            // Якщо дата і час вильоту вже минули, оновлюємо статус на false
            if ((flight.getDeparture_date().before(currentDate)) ||
                    (flight.getDeparture_date().equals(currentDate) && flight.getDeparture_time().before(currentTime))) {
                if (flight.isStatus()) { // Оновлюємо тільки якщо статус ще true
                    flight.setStatus(false);
                    flightRepository.save(flight);
                }
            }
        }
    }

    public List<FlightDTO> getFlightsByAviaId(Long aviaId) {
        return flightRepository.findByAviaId(aviaId).stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    public FlightDTO createFlight(FlightDTO flightDTO, Long userIdFromToken) {
        if (!Objects.equals(flightDTO.getAvia_id(), userIdFromToken)) {
            throw new IllegalArgumentException("User ID does not match avia_id");
        }

        LocalDate departureDate = flightDTO.getDeparture_date().toLocalDate();
        LocalDate arrivalDate = flightDTO.getArrival_date().toLocalDate();
        LocalTime departureTime = flightDTO.getDeparture_time().toLocalTime();
        LocalTime arrivalTime = flightDTO.getArrival_time().toLocalTime();

        LocalDateTime departureDateTime = LocalDateTime.of(departureDate, departureTime);
        LocalDateTime arrivalDateTime = LocalDateTime.of(arrivalDate, arrivalTime);
        LocalDateTime now = LocalDateTime.now();

        LocalDateTime minAllowedDeparture = now.plusHours(24);
        if (departureDateTime.isBefore(minAllowedDeparture)) {
            throw new IllegalArgumentException("Departure date/time cannot be earlier than 24 hours from now");
        }

        if (arrivalDateTime.isBefore(departureDateTime)) {
            throw new IllegalArgumentException("Arrival date/time cannot be before departure date/time");
        }

        Duration flightDuration = Duration.between(departureDateTime, arrivalDateTime);
        if (flightDuration.toHours() > 24) {
            throw new IllegalArgumentException("Flight duration cannot exceed 24 hours");
        }

        Flight flight = mapper.toEntity(flightDTO);

        flight.setStatus(true);
        flight.setOccupied_seats(0);

        flight = flightRepository.save(flight);
        return mapper.toDTO(flight);
    }

    public FlightDTO updateFlight(Long id, FlightDTO flightDTO, Long idFromToken, String roleFromToken) {
        return flightRepository.findById(id).map(existingFlight -> {
            if (!Objects.equals(existingFlight.getAvia_id(), idFromToken) && Objects.equals("AVIA", roleFromToken))
                throw new IllegalArgumentException("User ID does not match");
            if (flightDTO.getAvia_id() != 0) {
                existingFlight.setAvia_id(flightDTO.getAvia_id());
            }
            if (flightDTO.getPlane_number() != null) {
                existingFlight.setPlane_number(flightDTO.getPlane_number());
            }
            if (flightDTO.getDeparture() != null) {
                existingFlight.setDeparture(flightDTO.getDeparture());
            }
            if (flightDTO.getDestination() != null) {
                existingFlight.setDestination(flightDTO.getDestination());
            }
            if (flightDTO.getDeparture_time() != null) {
                existingFlight.setDeparture_time(flightDTO.getDeparture_time());
            }
            if (flightDTO.getArrival_time() != null) {
                existingFlight.setArrival_time(flightDTO.getArrival_time());
            }
            if (flightDTO.getDeparture_date() != null) {
                existingFlight.setDeparture_date(flightDTO.getDeparture_date());
            }
            if (flightDTO.getArrival_date() != null) {
                existingFlight.setArrival_date(flightDTO.getArrival_date());
            }
            if (flightDTO.getTicket_price() != 0) {
                existingFlight.setTicket_price(flightDTO.getTicket_price());
            }
            if (flightDTO.getSeats() != 0) {
                existingFlight.setSeats(flightDTO.getSeats());
            }
            if (flightDTO.getOccupied_seats() != 0) {
                existingFlight.setOccupied_seats(flightDTO.getOccupied_seats());
            }
            flightRepository.save(existingFlight);
            return mapper.toDTO(existingFlight);
        }).orElse(null);
    }

    public FlightDTO statusFlight(Long id, Long idFromToken, String roleFromToken) {
        return flightRepository.findById(id).map(existingFlight -> {
            if (!Objects.equals(existingFlight.getAvia_id(), idFromToken) && Objects.equals("AVIA", roleFromToken))
                throw new IllegalArgumentException("User ID does not match");

            // Змінюємо статус літака
            existingFlight.setStatus(false);
            flightRepository.save(existingFlight);

            // Отримуємо список замовлень по літаку
            List<Order> orders = orderRepository.findByFlight_id(id);

            for (Order order : orders) {
                // Якщо замовлення зі статусом "paid"
                if ("paid".equals(order.getPayment_status())) {
                    Long userId = order.getClient_id();
                    Long flightId = order.getFlight_id();

                    // Знаходимо літак за flightId
                    Flight flight = flightRepository.findById(flightId)
                            .orElseThrow(() -> new IllegalArgumentException("Flight not found with ID: " + flightId));

                    // Отримуємо avia_id із літака
                    Long aviaId = flight.getAvia_id();

                    // Розраховуємо бонус
                    long bonusAmount = order.getTotal_price();

                    // Знаходимо або створюємо запис у Bonus
                    Bonus bonus = bonusRepository.findByUserIdAndAviaId(userId, aviaId);
                    if (bonus == null) {
                        bonus = new Bonus();
                        bonus.setClient_id(userId);
                        bonus.setAvia_id(aviaId);
                        bonus.setBonus_count(bonusAmount);
                    } else {
                        bonus.setBonus_count(bonus.getBonus_count() + bonusAmount);
                    }
                    bonusRepository.save(bonus);
                }

                // Змінюємо статус замовлення на "canceled"
                order.setPayment_status("canceled");
                orderRepository.save(order);
            }

            return mapper.toDTO(existingFlight);
        }).orElse(null);
    }
}
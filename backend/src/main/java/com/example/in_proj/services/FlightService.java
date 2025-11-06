package com.example.in_proj.services;

import com.example.in_proj.dto.FlightDTO;
import com.example.in_proj.entity.Bonus;
import com.example.in_proj.entity.Order;
import com.example.in_proj.entity.Flight;
import com.example.in_proj.entity.Plane;
import com.example.in_proj.mapper.FlightMapper;
import com.example.in_proj.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.sql.Time;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class FlightService {

    private final UserService userService;
    private final PlaneService planeService;
    private final AirportService airportService;
    private final FlightRepository flightRepository;
    private final OrderRepository orderRepository;
    private final BonusRepository bonusRepository;
    private final PlaneRepository planeRepository;
    private final AirportRepository airportRepository;
    private final FlightMapper mapper = FlightMapper.INSTANCE;

    public List<Map<String, Object>> getAvia(Set<Long> aviaIds) {
        return aviaIds.stream()
                .map(userService::getUser)
                .filter(Objects::nonNull)
                .map(user -> {
                    Map<String, Object> minimalUser = new HashMap<>();
                    minimalUser.put("id", user.getId());
                    minimalUser.put("name", user.getName());
                    return minimalUser;
                })
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getPlanes(Set<Long> planeIds) {
        return planeIds.stream()
                .map(planeService::getPlane)
                .filter(Objects::nonNull)
                .map(plane -> {
                    Map<String, Object> minimalPlane = new HashMap<>();
                    minimalPlane.put("id", plane.getId());
                    minimalPlane.put("model", plane.getModel());
                    minimalPlane.put("seats_number", plane.getSeats_number());
                    return minimalPlane;
                })
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getAirports(Set<Long> airportIds) {
        return airportIds.stream()
                .map(airportService::getAirport)
                .filter(Objects::nonNull)
                .map(airport -> {
                    Map<String, Object> minimalAirport = new HashMap<>();
                    minimalAirport.put("id", airport.getId());
                    minimalAirport.put("name", airport.getName());
                    minimalAirport.put("city", airport.getCity());
                    minimalAirport.put("code", airport.getCode());
                    minimalAirport.put("country", airport.getCountry());
                    return minimalAirport;
                })
                .collect(Collectors.toList());
    }

    public Map<String, Object> getAllFlightsCombined(Set<Long> flightIds) {
        checkAndUpdateFlightStatuses();

        List<Flight> flights = flightIds == null ?
                flightRepository.findAll() :
                flightRepository.findAllById(flightIds);

        if (flights.isEmpty()) return null;

        List<FlightDTO> flightDTOs = flights.stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());

        Set<Long> aviaIds = flights.stream()
                .map(Flight::getAvia_id)
                .collect(Collectors.toSet());

        Set<Long> planeIds = flights.stream()
                .map(Flight::getPlane_id)
                .collect(Collectors.toSet());

        Set<Long> airportIds = flights.stream()
                .flatMap(f -> Stream.of(f.getDeparture_id(), f.getDestination_id()))
                .collect(Collectors.toSet());

        Map<String, Object> combined = new HashMap<>();
        combined.put("flights", flightDTOs);
        combined.put("airlines", getAvia(aviaIds));
        combined.put("planes", getPlanes(planeIds));
        combined.put("airports", getAirports(airportIds));

        return combined;
    }

    public Map<String, Object> getFlightsByStatus() {
        checkAndUpdateFlightStatuses();

        List<Flight> flights = flightRepository.findByStatus(true);

        if (flights.isEmpty()) return null;

        List<FlightDTO> flightDTOs = flights.stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());

        Set<Long> aviaIds = flights.stream()
                .map(Flight::getAvia_id)
                .collect(Collectors.toSet());

        Set<Long> planeIds = flights.stream()
                .map(Flight::getPlane_id)
                .collect(Collectors.toSet());

        Set<Long> airportIds = flights.stream()
                .flatMap(f -> Stream.of(f.getDeparture_id(), f.getDestination_id()))
                .collect(Collectors.toSet());

        Map<String, Object> combined = new HashMap<>();
        combined.put("flights", flightDTOs);
        combined.put("airlines", getAvia(aviaIds));
        combined.put("planes", getPlanes(planeIds));
        combined.put("airports", getAirports(airportIds));

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

    public Map<String, Object> getFlightsByAviaId(Long aviaId) {
        List<Flight> flights = flightRepository.findByAviaId(aviaId);

        if (flights.isEmpty()) return null;

        List<FlightDTO> flightDTOs = flights.stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());

        Set<Long> planeIds = flights.stream()
                .map(Flight::getPlane_id)
                .collect(Collectors.toSet());

        Set<Long> airportIds = flights.stream()
                .flatMap(f -> Stream.of(f.getDeparture_id(), f.getDestination_id()))
                .collect(Collectors.toSet());

        Map<String, Object> combined = new HashMap<>();
        combined.put("flights", flightDTOs);
        combined.put("planes", getPlanes(planeIds));
        combined.put("airports", getAirports(airportIds));

        return combined;
    }

    public FlightDTO createFlight(FlightDTO flightDTO, Long userIdFromToken) {
        flightDTO.setAvia_id(userIdFromToken);

        Long departureId = flightDTO.getDeparture_id();
        Long destinationId = flightDTO.getDestination_id();

        planeRepository.findById(flightDTO.getPlane_id())
                .orElseThrow(() -> new IllegalArgumentException("Plane not found with ID: " + flightDTO.getPlane_id()));

        airportRepository.findById(flightDTO.getDeparture_id())
                .orElseThrow(() -> new IllegalArgumentException("Airport not found with ID: " + flightDTO.getDeparture_id()));

        airportRepository.findById(flightDTO.getDestination_id())
                .orElseThrow(() -> new IllegalArgumentException("Airport not found with ID: " + flightDTO.getDestination_id()));

        if (Objects.equals(departureId, destinationId)) {
            throw new IllegalArgumentException("Departure and destination airports cannot be the same.");
        }

        if (departureId != 1 && destinationId != 1) {
            throw new IllegalArgumentException("Either departure or destination airport must have ID = 1.");
        }

        LocalDate departureDate = flightDTO.getDeparture_date().toLocalDate();
        LocalDate arrivalDate = flightDTO.getArrival_date().toLocalDate();
        LocalTime departureTime = flightDTO.getDeparture_time().toLocalTime();
        LocalTime arrivalTime = flightDTO.getArrival_time().toLocalTime();

        LocalDateTime departureDateTime = LocalDateTime.of(departureDate, departureTime);
        LocalDateTime arrivalDateTime = LocalDateTime.of(arrivalDate, arrivalTime);
        LocalDateTime now = LocalDateTime.now();

        flightValidation(flightDTO.getTicket_price(), departureDateTime, arrivalDateTime);

        LocalDateTime minAllowedDeparture = now.plusHours(24);
        if (departureDateTime.isBefore(minAllowedDeparture)) {
            throw new IllegalArgumentException("Departure date/time cannot be earlier than 24 hours from now");
        }

        if (departureDate.isAfter(now.toLocalDate().plusYears(1))) {
            throw new IllegalArgumentException("Departure date cannot be more than 1 year in the future.");
        }

        Flight flight = mapper.toEntity(flightDTO);

        flight.setStatus(true);
        flight.setOccupied_seats(0);

        flight = flightRepository.save(flight);
        return mapper.toDTO(flight);
    }

    public FlightDTO updateFlight(Long id, FlightDTO flightDTO, Long idFromToken, String roleFromToken) {
        Flight existingFlight = flightRepository.findById(id).orElse(null);

        if (existingFlight == null) {
            return null;
        }

        if (!Objects.equals(existingFlight.getAvia_id(), idFromToken) && !"ADMIN".equals(roleFromToken)) {
            throw new IllegalArgumentException("User ID does not match");
        }

        LocalDate departureDate = flightDTO.getDeparture_date().toLocalDate();
        LocalDate arrivalDate = flightDTO.getArrival_date().toLocalDate();
        LocalTime departureTime = flightDTO.getDeparture_time().toLocalTime();
        LocalTime arrivalTime = flightDTO.getArrival_time().toLocalTime();

        LocalDateTime departureDateTime = LocalDateTime.of(departureDate, departureTime);
        LocalDateTime arrivalDateTime = LocalDateTime.of(arrivalDate, arrivalTime);

        flightValidation(flightDTO.getTicket_price(), departureDateTime, arrivalDateTime);

        LocalDate oldDepartureDate = existingFlight.getDeparture_date().toLocalDate();
        LocalTime oldDepartureTime = existingFlight.getDeparture_time().toLocalTime();
        LocalDateTime oldDepartureDateTime = LocalDateTime.of(oldDepartureDate, oldDepartureTime);

        if (departureDateTime.isBefore(oldDepartureDateTime)) {
            throw new IllegalArgumentException("New departure date/time cannot be earlier than the original one.");
        }

        LocalDateTime now = LocalDateTime.now();
        if (departureDate.isAfter(now.toLocalDate().plusYears(1))) {
            throw new IllegalArgumentException("Departure date cannot be more than 1 year in the future.");
        }

        if (flightDTO.getDeparture_time() != null) existingFlight.setDeparture_time(flightDTO.getDeparture_time());
        if (flightDTO.getArrival_time() != null) existingFlight.setArrival_time(flightDTO.getArrival_time());
        if (flightDTO.getDeparture_date() != null) existingFlight.setDeparture_date(flightDTO.getDeparture_date());
        if (flightDTO.getArrival_date() != null) existingFlight.setArrival_date(flightDTO.getArrival_date());
        if (flightDTO.getTicket_price() != 0) existingFlight.setTicket_price(flightDTO.getTicket_price());

        flightRepository.save(existingFlight);

        return mapper.toDTO(existingFlight);
    }

    public Map<String, Object> statusFlight(Long id, Long idFromToken, String roleFromToken) {
        Flight existingFlight = flightRepository.findById(id).orElse(null);
        Map<String, Object> response = new HashMap<>();

        if (existingFlight == null) {
            response.put("status", HttpStatus.NOT_FOUND.value());
            response.put("message", "No flight found with ID '" + id + "'.");
            return response;
        } else if (!existingFlight.isStatus()) {
            response.put("status", HttpStatus.BAD_REQUEST.value());
            response.put("message", "Flight with ID '" + existingFlight.getId() + "' already deactivated");
            return response;
        }

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

        mapper.toDTO(existingFlight);

        response.put("status", HttpStatus.OK.value());
        response.put("message", "Flight with ID '" + existingFlight.getId() + "' successfully deactivated");

        return response;
    }

    private void flightValidation (Long ticketPrice, LocalDateTime departureDateTime, LocalDateTime arrivalDateTime) {
        if (ticketPrice < 50 || ticketPrice > 99999) {
            throw new IllegalArgumentException("Ticket price must be between 50 and 99999.");
        }

        if (arrivalDateTime.isBefore(departureDateTime)) {
            throw new IllegalArgumentException("Arrival date/time cannot be before departure date/time");
        }

        Duration flightDuration = Duration.between(departureDateTime, arrivalDateTime);
        if (flightDuration.toHours() > 24) {
            throw new IllegalArgumentException("Flight duration cannot exceed 24 hours");
        }

        if (flightDuration.toMinutes() < 30) {
            throw new IllegalArgumentException("Flight duration must be at least 30 minutes.");
        }
    }
}
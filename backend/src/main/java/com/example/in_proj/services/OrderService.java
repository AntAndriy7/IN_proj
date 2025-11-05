package com.example.in_proj.services;

import com.example.in_proj.dto.OrderDTO;
import com.example.in_proj.dto.TicketDTO;
import com.example.in_proj.mapper.OrderMapper;
import com.example.in_proj.entity.*;
import com.example.in_proj.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final TicketService ticketService;
    private final FlightService flightService;
    private final PlaneRepository planeRepository;
    private final BonusRepository bonusRepository;
    private final OrderRepository orderRepository;
    private final FlightRepository flightRepository;
    private final TicketRepository ticketRepository;
    private final OrderMapper mapper = OrderMapper.INSTANCE;

    public List<List<?>> getOrdersByClientId(Long clientId) {
        List<Order> orders = orderRepository.findByClient_id(clientId);

        List<OrderDTO> orderDTOs = orders.stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());

        Set<Long> flightIds = orders.stream()
                .map(Order::getFlight_id)
                .collect(Collectors.toSet());

        List<TicketDTO> tickets = orders.stream()
                .flatMap(order -> ticketService.getTicketsByOrderId(order.getId()).stream())
                .collect(Collectors.toList());

        List<List<?>> combined = flightService.getAllFlightsCombined(flightIds);
        combined.add(orderDTOs);
        combined.add(tickets);

        return combined;
    }

    public OrderDTO addOrder(Long clientId, OrderDTO orderDTO, List<String> names, long usedBonuses) {
        // Валідація списку імен
        if (names == null || names.isEmpty()) {
            throw new IllegalArgumentException("Tickets cannot be empty.");
        }

        for (String name : names) {
            nameValidation(name);
        }

        // Отримуємо рейс
        Flight flight = flightRepository.findById(orderDTO.getFlight_id())
                .orElseThrow(() -> new IllegalArgumentException("Flight not found with ID: " + orderDTO.getFlight_id()));

        // Отримуємо літак
        Plane plane = planeRepository.findById(flight.getPlane_id())
                .orElseThrow(() -> new IllegalArgumentException("Plane not found with ID: " + flight.getPlane_id()));

        long tickets_price = flight.getTicket_price() * names.size();

        if (usedBonuses != 0) {
            // Отримуємо bonus
            Bonus bonus = bonusRepository.findByUserIdAndAviaId(clientId, flight.getAvia_id());
            if (bonus == null) {
                throw new IllegalArgumentException("Bonus not found!");
            } else if (bonus.getBonus_count() < usedBonuses) {
                throw new IllegalArgumentException("The bonuses used are not valid!");
            } else if (usedBonuses > tickets_price / 2) {
                throw new IllegalArgumentException("Maximum allowed used bonuses 50% of the total order price.");
            } else if (usedBonuses < 10) {
                throw new IllegalArgumentException("The minimum amount of bonuses used is 10.");
            }

            bonus.setBonus_count(bonus.getBonus_count() - usedBonuses);
            bonusRepository.save(bonus);
        }

        // Перевіряємо наявність достатньої кількості місць
        List<Long> occupiedSeats = getOccupiedSeatsForFlight(flight.getId());
        long availableSeats = plane.getSeats_number() - occupiedSeats.size();
        if (availableSeats < names.size()) {
            throw new IllegalArgumentException("Not enough seats available.");
        }

        orderDTO.setClient_id(clientId);
        orderDTO.setTicket_quantity(names.size());
        orderDTO.setTotal_price(tickets_price - usedBonuses);
        orderDTO.setPayment_status("booked");

        // Створюємо замовлення
        Order order = mapper.toEntity(orderDTO);
        //order.setTotal_price(flight.getTicket_price() * names.size());
        order = orderRepository.save(order);

        // Генеруємо список доступних номерів місць
        List<Long> availableSeatNumbers = new ArrayList<>();
        for (long i = 1; i <= plane.getSeats_number(); i++) {
            if (!occupiedSeats.contains(i)) {
                availableSeatNumbers.add(i);
            }
        }

        // Створюємо квитки
        List<Ticket> tickets = new ArrayList<>();
        for (int i = 0; i < names.size(); i++) {
            Ticket ticket = new Ticket();
            ticket.setOrder_id(order.getId());
            ticket.setName(names.get(i));
            ticket.setSeat_number(availableSeatNumbers.get(i));
            tickets.add(ticket);
            flight.setOccupied_seats(flight.getOccupied_seats() + 1);
        }

        // Зберігаємо квитки
        ticketRepository.saveAll(tickets);

        // Оновлюємо потяг з новими даними occupied_seats
        flightRepository.save(flight);

        // Повертаємо DTO
        return mapper.toDTO(order);
    }

    public List<Long> getOccupiedSeatsForFlight(Long flightId) {
        List<Order> bookedOrders = orderRepository.findByFlight_idPayment_status(flightId, Arrays.asList("booked", "paid"));

        List<Long> occupiedSeats = new ArrayList<>();
        for (Order order : bookedOrders) {
            List<Ticket> tickets = ticketRepository.findByOrder_id(order.getId());
            tickets.forEach(ticket -> occupiedSeats.add(ticket.getSeat_number()));
        }

        return occupiedSeats;
    }

    public OrderDTO updateOrder(Long id, OrderDTO orderDTO, Long idFromToken) {
        Order existingOrder = orderRepository.findById(id).orElse(null);
        if (existingOrder == null) {
            return null;
        }

        if (!Objects.equals(existingOrder.getClient_id(), idFromToken)) {
            throw new IllegalArgumentException("User ID does not match");
        }

        if (orderDTO.getPayment_status() != null) {
            if ("canceled".equals(orderDTO.getPayment_status())) {
                processOrder(existingOrder, 2);
            } else if ("paid".equals(orderDTO.getPayment_status())) {
                existingOrder.setPayment_status(orderDTO.getPayment_status());
            } else {
                throw new IllegalArgumentException("Payment updated status cannot be " + orderDTO.getPayment_status());
            }
        }

        orderRepository.save(existingOrder);

        return mapper.toDTO(existingOrder);
    }


    public void processOrder(Order order, int divider) {
        Long userId = order.getClient_id();
        Long flightId = order.getFlight_id();

        // Знаходимо літак за flightId
        Flight flight = flightRepository.findById(flightId)
                .orElseThrow(() -> new IllegalArgumentException("Flight not found with ID: " + flightId));

        // Зменшуємо кількість місць
        flight.setOccupied_seats(flight.getOccupied_seats() - order.getTicket_quantity());

        // Якщо замовлення зі статусом "paid"
        if ("paid".equals(order.getPayment_status())) {
            // Отримуємо avia_id із літака
            Long aviaId = flight.getAvia_id();

            // Розраховуємо бонус
            long bonusAmount = order.getTotal_price() / divider;

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
        flightRepository.save(flight);
    }

    private boolean containsHtml(String input) {
        return input != null && input.matches(".*<[^>]+>.*");
    }

    private void nameValidation(String name) {
        if (containsHtml(name)) {
            throw new IllegalArgumentException("Name cannot contain HTML tags.");
        }
        if (name == null || name.isBlank())
            throw new IllegalArgumentException("Name cannot be empty");
        if (name.length() > 201)
            throw new IllegalArgumentException("Name cannot exceed 201 characters");
    }
}
package com.example.in_proj.services;

import com.example.in_proj.auth.JwtUtil;
import com.example.in_proj.dto.OrderDTO;
import com.example.in_proj.dto.FlightDTO;
import com.example.in_proj.dto.TicketDTO;
import com.example.in_proj.entity.Bonus;
import com.example.in_proj.entity.Order;
import com.example.in_proj.entity.Flight;
import com.example.in_proj.entity.Ticket;
import com.example.in_proj.mapper.OrderMapper;
import com.example.in_proj.mapper.FlightMapper;
import com.example.in_proj.repository.BonusRepository;
import com.example.in_proj.repository.OrderRepository;
import com.example.in_proj.repository.FlightRepository;
import com.example.in_proj.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final TicketService ticketService;
    private final FlightService flightService;
    private final BonusRepository bonusRepository;
    private final OrderRepository orderRepository;
    private final FlightRepository flightRepository;
    private final TicketRepository ticketRepository;
    private final OrderMapper mapper = OrderMapper.INSTANCE;

    public List<List<?>> getOrdersByClientId(Long clientId) {
        // 1. Отримуємо замовлення по clientId
        List<Order> orders = orderRepository.findByClient_id(clientId);

        // 2. Перетворюємо замовлення в DTO
        List<OrderDTO> orderDTOs = orders.stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());

        // 3. Отримуємо літаки, пов’язані з замовленнями через FlightService
        Set<Long> flightIds = orders.stream()
                .map(Order::getFlight_id)
                .collect(Collectors.toSet());

        List<FlightDTO> flights = flightService.getAllFlights(flightIds);

        // 4. Мінімальні дані авіа-користувачів через FlightService
        Set<Long> aviaIds = flights.stream()
                .map(FlightDTO::getAvia_id)
                .collect(Collectors.toSet());

        List<Map<String, Object>> users = flightService.getAvia(aviaIds);

        // 5. Отримуємо всі квитки для цих замовлень через TicketService
        List<TicketDTO> tickets = orders.stream()
                .flatMap(order -> ticketService.getTicketsByOrderId(order.getId()).stream())
                .collect(Collectors.toList());

        // 6. Формуємо комбінований список
        List<List<?>> combined = new ArrayList<>();
        combined.add(orderDTOs);  // 1-й список — замовлення
        combined.add(flights);     // 2-й список — літаки
        combined.add(users);      // 3-й список — авіа-користувачі
        combined.add(tickets);    // 4-й список — квитки

        return combined;
    }

    public OrderDTO addOrder(OrderDTO orderDTO, List<String> names, long usedBonuses) {
        // Валідація списку імен
        if (names == null || names.isEmpty()) {
            throw new IllegalArgumentException("Name list cannot be empty.");
        }

        System.out.println("Total Price: " + orderDTO.getTotal_price());
        System.out.println("Used Bonuses: " + usedBonuses);

        // Отримуємо літак
        Flight flight = flightRepository.findById(orderDTO.getFlight_id())
                .orElseThrow(() -> new IllegalArgumentException("Flight not found with ID: " + orderDTO.getFlight_id()));

        if (usedBonuses != 0) {
            // Отримуємо bonus
            Bonus bonus = bonusRepository.findByUserIdAndAviaId(orderDTO.getClient_id(), flight.getAvia_id());
            if (bonus == null) {
                throw new IllegalArgumentException("Bonus not found!");
            } else if (bonus.getBonus_count() < usedBonuses) {
                throw new IllegalArgumentException("The bonuses used are not valid!");
            } else if (flight.getTicket_price() * names.size() - usedBonuses != orderDTO.getTotal_price()) {
                throw new IllegalArgumentException("The order itself is not valid!");
            }

            bonus.setBonus_count(bonus.getBonus_count() - usedBonuses);
            bonusRepository.save(bonus);
        }

        // Перевіряємо наявність достатньої кількості місць
        List<Long> occupiedSeats = getOccupiedSeatsForFlight(flight.getId());
        long availableSeats = flight.getSeats() - occupiedSeats.size();
        if (availableSeats < names.size()) {
            throw new IllegalArgumentException("Not enough seats available.");
        }

        // Створюємо замовлення
        Order order = mapper.toEntity(orderDTO);
        //order.setTotal_price(flight.getTicket_price() * names.size());
        order = orderRepository.save(order);

        // Генеруємо список доступних номерів місць
        List<Long> availableSeatNumbers = new ArrayList<>();
        for (long i = 1; i <= flight.getSeats(); i++) {
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
        return orderRepository.findById(id).map(existingOrder -> {
            if (!Objects.equals(existingOrder.getClient_id(), idFromToken))
                throw new IllegalArgumentException("User ID does not match");
            if (orderDTO.getClient_id() != 0) {
                existingOrder.setClient_id(orderDTO.getClient_id());
            }
            if (orderDTO.getFlight_id() != 0) {
                existingOrder.setFlight_id(orderDTO.getFlight_id());
            }
            if (orderDTO.getTicket_quantity() != 0) {
                existingOrder.setTicket_quantity(orderDTO.getTicket_quantity());
            }
            if (orderDTO.getTotal_price() != 0) {
                existingOrder.setTotal_price(orderDTO.getTotal_price());
            }
            if (orderDTO.getPayment_status() != null) {
                if ("canceled".equals(orderDTO.getPayment_status())) {
                    processOrder(existingOrder, 2);
                } else {
                    existingOrder.setPayment_status(orderDTO.getPayment_status());
                }
            }
            return mapper.toDTO(orderRepository.save(existingOrder));
        }).orElse(null);
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
}
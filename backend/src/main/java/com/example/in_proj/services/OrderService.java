package com.example.in_proj.services;

import com.example.in_proj.dto.OrderDTO;
import com.example.in_proj.dto.TicketDTO;
import com.example.in_proj.mapper.OrderMapper;
import com.example.in_proj.entity.*;
import com.example.in_proj.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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

    public Map<String, Object> getOrdersByClientId(Long clientId) {
        List<Order> orders = orderRepository.findByClient_id(clientId);

        if (orders.isEmpty()) return null;

        List<OrderDTO> orderDTOs = orders.stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());

        Set<Long> flightIds = orders.stream()
                .map(Order::getFlight_id)
                .collect(Collectors.toSet());

        List<TicketDTO> tickets = orders.stream()
                .flatMap(order -> ticketService.getTicketsByOrderId(order.getId()).stream())
                .collect(Collectors.toList());

        Map<String, Object> flightsData = flightService.getAllFlightsCombined(flightIds);

        Map<String, Object> combined = new HashMap<>();
        combined.put("orders", orderDTOs);
        combined.put("tickets", tickets);
        combined.put("flightsData", flightsData);

        return combined;
    }

    public Map<String, Object> getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) return null;

        OrderDTO orderDTO = mapper.toDTO(order);

        List<TicketDTO> tickets = ticketService.getTicketsByOrderId(orderId);

        Long flightId = order.getFlight_id();
        Map<String, Object> flightData = flightService.getAllFlightsCombined(Set.of(flightId));

        Map<String, Object> combined = new HashMap<>();
        combined.put("order", orderDTO);
        combined.put("tickets", tickets);
        combined.put("flightData", flightData);

        return combined;
    }

    public OrderDTO addOrder(Long clientId, OrderDTO orderDTO, List<TicketDTO> ticketsDTO, long usedBonuses) {
        // Валідація списку квитків
        if (ticketsDTO == null || ticketsDTO.isEmpty()) {
            throw new IllegalArgumentException("Tickets cannot be empty.");
        }

        for (TicketDTO ticketDTO : ticketsDTO) {
            nameValidation(ticketDTO.getName());
        }

        // Отримуємо рейс
        Flight flight = flightRepository.findById(orderDTO.getFlight_id())
                .orElseThrow(() -> new IllegalArgumentException("Flight not found with ID: " + orderDTO.getFlight_id()));

        // Отримуємо літак
        Plane plane = planeRepository.findById(flight.getPlane_id())
                .orElseThrow(() -> new IllegalArgumentException("Plane not found with ID: " + flight.getPlane_id()));

        long tickets_price = flight.getTicket_price() * ticketsDTO.size();

        if (usedBonuses != 0) {
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

        // Перевірка наявності місць
        long existingTicketsCount = getOccupiedSeatCount(flight.getId());
        long availableSeats = plane.getSeats_number() - existingTicketsCount;
        if (availableSeats < ticketsDTO.size()) {
            throw new IllegalArgumentException("Not enough seats available.");
        }

        orderDTO.setClient_id(clientId);
        orderDTO.setTicket_quantity(ticketsDTO.size());
        orderDTO.setTotal_price(tickets_price - usedBonuses);
        orderDTO.setPayment_status("booked");

        // Зберігаємо замовлення
        Order order = mapper.toEntity(orderDTO);
        order = orderRepository.save(order);

        // Створюємо квитки
        List<Ticket> tickets = new ArrayList<>();
        for (TicketDTO ticketDTO : ticketsDTO) {
            Ticket ticket = new Ticket();
            ticket.setOrder_id(order.getId());
            ticket.setName(ticketDTO.getName());
            ticket.setAdult(ticketDTO.isAdult());
            tickets.add(ticket);
            flight.setOccupied_seats(flight.getOccupied_seats() + 1);
        }

        ticketRepository.saveAll(tickets);
        flightRepository.save(flight);

        return mapper.toDTO(order);
    }

    public long getOccupiedSeatCount(Long flightId) {
        List<Order> bookedOrders = orderRepository.findByFlight_idPayment_status(flightId, Arrays.asList("booked", "paid"));

        long occupiedCount = 0;
        for (Order order : bookedOrders) {
            List<Ticket> tickets = ticketRepository.findByOrder_id(order.getId());
            occupiedCount += tickets.size();
        }

        return occupiedCount;
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
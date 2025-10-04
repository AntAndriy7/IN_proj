package com.example.in_proj.services;

import com.example.in_proj.dto.OrderDTO;
import com.example.in_proj.entity.Bonus;
import com.example.in_proj.entity.Order;
import com.example.in_proj.entity.Plane;
import com.example.in_proj.entity.Ticket;
import com.example.in_proj.mapper.OrderMapper;
import com.example.in_proj.repository.BonusRepository;
import com.example.in_proj.repository.OrderRepository;
import com.example.in_proj.repository.PlaneRepository;
import com.example.in_proj.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;


import java.util.Arrays;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final BonusRepository bonusRepository;
    private final OrderRepository orderRepository;
    private final PlaneRepository planeRepository;
    private final TicketRepository ticketRepository;
    private final OrderMapper mapper = OrderMapper.INSTANCE;

    public List<OrderDTO> getOrdersByClientId(Long clientId) {
        return orderRepository.findByClient_id(clientId).stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    public OrderDTO addOrder(OrderDTO orderDTO, List<String> names, long usedBonuses) {
        // Валідація списку імен
        if (names == null || names.isEmpty()) {
            throw new IllegalArgumentException("Name list cannot be empty.");
        }

        System.out.println("Total Price: " + orderDTO.getTotal_price());
        System.out.println("Used Bonuses: " + usedBonuses);

        // Отримуємо літак
        Plane plane = planeRepository.findById(orderDTO.getPlane_id())
                .orElseThrow(() -> new IllegalArgumentException("Plane not found with ID: " + orderDTO.getPlane_id()));

        if (usedBonuses != 0) {
            // Отримуємо bonus
            Bonus bonus = bonusRepository.findByUserIdAndAviaId(orderDTO.getClient_id(), plane.getAvia_id());
            if (bonus == null) {
                throw new IllegalArgumentException("Bonus not found!");
            } else if (bonus.getBonus_count() < usedBonuses) {
                throw new IllegalArgumentException("The bonuses used are not valid!");
            } else if (plane.getTicket_price() * names.size() - usedBonuses != orderDTO.getTotal_price()) {
                throw new IllegalArgumentException("The order itself is not valid!");
            }

            bonus.setBonus_count(bonus.getBonus_count() - usedBonuses);
            bonusRepository.save(bonus);
        }

        // Перевіряємо наявність достатньої кількості місць
        List<Long> occupiedSeats = getOccupiedSeatsForPlane(plane.getId());
        long availableSeats = plane.getSeats() - occupiedSeats.size();
        if (availableSeats < names.size()) {
            throw new IllegalArgumentException("Not enough seats available.");
        }

        // Створюємо замовлення
        Order order = mapper.toEntity(orderDTO);
        //order.setTotal_price(plane.getTicket_price() * names.size());
        order = orderRepository.save(order);

        // Генеруємо список доступних номерів місць
        List<Long> availableSeatNumbers = new ArrayList<>();
        for (long i = 1; i <= plane.getSeats(); i++) {
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
            plane.setOccupied_seats(plane.getOccupied_seats() + 1);
        }

        // Зберігаємо квитки
        ticketRepository.saveAll(tickets);

        // Оновлюємо потяг з новими даними occupied_seats
        planeRepository.save(plane);

        // Повертаємо DTO
        return mapper.toDTO(order);
    }

    public List<Long> getOccupiedSeatsForPlane(Long planeId) {
        List<Order> bookedOrders = orderRepository.findByPlane_idPayment_status(planeId, Arrays.asList("booked", "paid"));

        List<Long> occupiedSeats = new ArrayList<>();
        for (Order order : bookedOrders) {
            List<Ticket> tickets = ticketRepository.findByOrder_id(order.getId());
            tickets.forEach(ticket -> occupiedSeats.add(ticket.getSeat_number()));
        }

        return occupiedSeats;
    }

    public OrderDTO updateOrder(Long id, OrderDTO orderDTO) {
        return orderRepository.findById(id).map(existingOrder -> {
            if (orderDTO.getClient_id() != 0) {
                existingOrder.setClient_id(orderDTO.getClient_id());
            }
            if (orderDTO.getPlane_id() != 0) {
                existingOrder.setPlane_id(orderDTO.getPlane_id());
            }
            if (orderDTO.getTicket_quantity() != 0) {
                existingOrder.setTicket_quantity(orderDTO.getTicket_quantity());
            }
            if (orderDTO.getTotal_price() != 0) {
                existingOrder.setTotal_price(orderDTO.getTotal_price());
            }
            if (orderDTO.getPayment_status() != null) {
                if ("paid".equals(existingOrder.getPayment_status()) && "canceled".equals(orderDTO.getPayment_status())) {
                    processOrder(existingOrder, 2);
                } else {
                    existingOrder.setPayment_status(orderDTO.getPayment_status());
                }
            }
            return mapper.toDTO(orderRepository.save(existingOrder));
        }).orElse(null);
    }

    public void processOrder(Order order, int divider) {
        // Якщо замовлення зі статусом "paid"
        if ("paid".equals(order.getPayment_status())) {
            Long userId = order.getClient_id();
            Long planeId = order.getPlane_id();

            // Знаходимо літак за planeId
            Plane plane = planeRepository.findById(planeId)
                    .orElseThrow(() -> new IllegalArgumentException("Plane not found with ID: " + planeId));

            // Отримуємо avia_id із літака
            Long aviaId = plane.getAvia_id();

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
    }
}
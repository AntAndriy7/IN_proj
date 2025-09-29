package com.example.in_proj.services;

import com.example.in_proj.dto.PlaneDTO;
import com.example.in_proj.entity.Bonus;
import com.example.in_proj.entity.Order;
import com.example.in_proj.entity.Plane;
import com.example.in_proj.mapper.PlaneMapper;
import com.example.in_proj.repository.BonusRepository;
import com.example.in_proj.repository.OrderRepository;
import com.example.in_proj.repository.PlaneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.sql.Time;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlaneService {

    private final PlaneRepository planeRepository;
    private final OrderRepository orderRepository;
    private final BonusRepository bonusRepository;
    private final PlaneMapper mapper = PlaneMapper.INSTANCE;

    public PlaneDTO getPlane(Long id) {
        return planeRepository.findById(id)
                .map(mapper::toDTO)
                .orElse(null);
    }

    public List<PlaneDTO> getAllPlanes() {
        checkAndUpdatePlaneStatuses();
        return planeRepository.findAll().stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<PlaneDTO> getPlanesByStatus() {
        checkAndUpdatePlaneStatuses();
        return planeRepository.findByStatus(true).stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
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

    public PlaneDTO createPlane(PlaneDTO planeDTO) {
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
                    long bonusAmount = order.getTotal_price() / 2;

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

            return mapper.toDTO(existingPlane);
        }).orElse(null);
    }
}

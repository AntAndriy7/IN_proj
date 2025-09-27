package com.example.in_proj.services;

import com.example.in_proj.dto.TicketDTO;
import com.example.in_proj.mapper.TicketMapper;
import com.example.in_proj.repository.OrderRepository;
import com.example.in_proj.repository.PlaneRepository;
import com.example.in_proj.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final PlaneRepository planeRepository;
    private final OrderRepository orderRepository;
    private final TicketMapper mapper = TicketMapper.INSTANCE;

    public List<TicketDTO> getTicketsByOrderId(Long orderId) {
        return ticketRepository.findByOrder_id(orderId).stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }
}

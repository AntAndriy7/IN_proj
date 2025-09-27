package com.example.in_proj.controllers;

import com.example.in_proj.dto.TicketDTO;
import com.example.in_proj.services.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "/api/ticket")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<TicketDTO>> getTicketsByOrderId(@PathVariable Long orderId) {
        List<TicketDTO> tickets = ticketService.getTicketsByOrderId(orderId);
        return tickets.isEmpty() ? ResponseEntity.notFound().build() : ResponseEntity.ok(tickets);
    }
}

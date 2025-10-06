package com.example.in_proj.controllers;

import com.example.in_proj.auth.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.in_proj.dto.OrderDTO;
import com.example.in_proj.services.OrderService;

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping(value = "/api/order")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<List<?>>> getOrdersByClientId(@PathVariable Long clientId,
                                                             @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        try {
            if (!Objects.equals(clientId, JwtUtil.getId(token)))
                throw new IllegalArgumentException("User ID does not match");

            List<List<?>> combined = orderService.getOrdersByClientId(clientId);

            if (combined.isEmpty() || combined.get(0).isEmpty())
                return ResponseEntity.notFound().build();

            return ResponseEntity.ok(combined);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PostMapping
    public ResponseEntity<OrderDTO> createOrder(@RequestBody OrderDTO orderDTO,
                                                @RequestParam List<String> tickets,
                                                @RequestParam(required = false) Long usedBonuses,
                                                @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        try {
            if (!Objects.equals(orderDTO.getClient_id(), JwtUtil.getId(token)))
                throw new IllegalArgumentException("User ID does not match");
            OrderDTO newOrder = orderService.addOrder(orderDTO, tickets, usedBonuses);
            return ResponseEntity.ok(newOrder);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrderDTO> updateOrder(@PathVariable Long id, @RequestBody OrderDTO orderDTO,
                                                @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        try {
            OrderDTO updatedOrder = orderService.updateOrder(id, orderDTO, JwtUtil.getId(token));
            if (updatedOrder == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(updatedOrder);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}

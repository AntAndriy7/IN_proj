package com.example.in_proj.controllers;

import com.example.in_proj.auth.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.in_proj.dto.OrderDTO;
import com.example.in_proj.services.OrderService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
    public ResponseEntity<?> createOrder(@RequestBody OrderDTO orderDTO, @RequestParam List<String> tickets,
                                         @RequestParam(required = false) Long usedBonuses,
                                         @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        Map<String, Object> response = new HashMap<>();

        try {
            OrderDTO order = orderService.addOrder(JwtUtil.getId(token), orderDTO, tickets, usedBonuses);

            return ResponseEntity.ok(order);

        } catch (IllegalArgumentException e) {
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateOrder(@PathVariable Long id, @RequestBody OrderDTO orderDTO,
                                         @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        Map<String, Object> response = new HashMap<>();

        try {
            OrderDTO order = orderService.updateOrder(id, orderDTO, JwtUtil.getId(token));

            if (order == null) {
                response.put("message", "No such order found.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            return ResponseEntity.ok(order);

        } catch (IllegalArgumentException e) {
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}

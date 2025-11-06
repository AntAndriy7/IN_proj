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

    @GetMapping("/client")
    public ResponseEntity<?> getOrdersByClientId(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");

        Map<String, Object> result = orderService.getOrdersByClientId(JwtUtil.getId(token));

        if (result == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "No orders found.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        return ResponseEntity.ok(result);
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
            Map<String, Object> errorResponse = new HashMap<>();
            String message = e.getMessage();

            errorResponse.put("message", message);

            if (message != null && message.toLowerCase().contains("not match")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
            } else {
                return ResponseEntity.badRequest().body(errorResponse);
            }
        }
    }
}

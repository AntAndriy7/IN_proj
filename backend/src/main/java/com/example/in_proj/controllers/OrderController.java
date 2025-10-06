package com.example.in_proj.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.in_proj.dto.OrderDTO;
import com.example.in_proj.services.OrderService;

import java.util.List;

@RestController
@RequestMapping(value = "/api/order")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<List<?>>> getOrdersByClientId(@PathVariable Long clientId) {
        List<List<?>> combined = orderService.getOrdersByClientId(clientId);
        if (combined.isEmpty() || combined.get(0).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(combined);
    }

    @PostMapping
    public ResponseEntity<OrderDTO> createOrder(@RequestBody OrderDTO orderDTO,
                                                @RequestParam List<String> tickets,
                                                @RequestParam(required = false) Long usedBonuses) {
        OrderDTO newOrder = orderService.addOrder(orderDTO, tickets, usedBonuses);
        return ResponseEntity.ok(newOrder);
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrderDTO> updateOrder(@PathVariable Long id, @RequestBody OrderDTO orderDTO) {
        OrderDTO updatedOrder = orderService.updateOrder(id, orderDTO);
        if (updatedOrder == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updatedOrder);
    }
}

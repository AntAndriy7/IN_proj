package com.example.in_proj.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderRequestDTO {
    private OrderDTO order;
    private List<TicketDTO> tickets;
    private Long usedBonuses;
}
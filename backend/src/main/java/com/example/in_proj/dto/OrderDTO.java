package com.example.in_proj.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderDTO {
    private long id;
    private long client_id;
    private long plane_id;
    private long ticket_quantity;
    private long total_price;
    private String payment_status;
}
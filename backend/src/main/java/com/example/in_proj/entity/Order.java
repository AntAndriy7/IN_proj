package com.example.in_proj.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "\"order\"")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private long id;

    @Column(name = "client_id")
    private long client_id;

    @Column(name = "plane_id")
    private long plane_id;

    @Column(name = "ticket_quantity")
    private long ticket_quantity;

    @Column(name = "total_price")
    private long total_price;

    @Column(name = "payment_status")
    private String payment_status;
}
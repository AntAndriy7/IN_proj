package com.example.in_proj.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "\"ticket\"")
public class Ticket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private long id;

    @Column(name = "order_id")
    private long order_id;

    @Column(name = "name")
    private String name;

    @Column(name = "is_adult")
    private Boolean adult;
}
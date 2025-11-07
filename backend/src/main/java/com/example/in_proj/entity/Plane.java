package com.example.in_proj.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "\"plane\"")
public class Plane {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private long id;

    @Column(name = "model")
    private String model;

    @Column(name = "seats_number")
    private long seats_number;

    @Column(name = "avia_id")
    private long avia_id;
}
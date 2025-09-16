package com.example.in_proj.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.sql.Date;
import java.sql.Time;

@Data
@Entity
@Table(name = "\"plane\"")
public class Plane {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private long id;

    @Column(name = "avia_id")
    private long avia_id;

    @Column(name = "plane_number")
    private String plane_number;

    @Column(name = "departure")
    private String departure;

    @Column(name = "destination")
    private String destination;

    @Column(name = "departure_time")
    private Time departure_time;

    @Column(name = "arrival_time")
    private Time arrival_time;

    @Column(name = "departure_date")
    private Date departure_date;

    @Column(name = "arrival_date")
    private Date arrival_date;

    @Column(name = "status")
    private boolean status;

    @Column(name = "ticket_price")
    private long ticket_price;

    @Column(name = "seats")
    private long seats;

    @Column(name = "occupied_seats")
    private long occupied_seats;
}
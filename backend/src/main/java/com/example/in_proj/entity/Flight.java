package com.example.in_proj.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.sql.Date;
import java.sql.Time;

@Data
@Entity
@Table(name = "\"flight\"")
public class Flight {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private long id;

    @Column(name = "avia_id")
    private long avia_id;

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

    @Column(name = "occupied_seats")
    private long occupied_seats;

    @Column(name = "plane_id")
    private long plane_id;

    @Column(name = "departure_id")
    private long departure_id;

    @Column(name = "destination_id")
    private long destination_id;
}
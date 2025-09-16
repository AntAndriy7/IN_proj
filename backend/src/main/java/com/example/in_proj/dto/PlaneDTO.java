package com.example.in_proj.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Date;
import java.sql.Time;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PlaneDTO {
    private long id;
    private long avia_id;
    private String plane_number;
    private String departure;
    private String destination;
    private Time departure_time;
    private Time arrival_time;
    private Date departure_date;
    private Date arrival_date;
    private boolean status;
    private long ticket_price;
    private long seats;
    private long occupied_seats;
}
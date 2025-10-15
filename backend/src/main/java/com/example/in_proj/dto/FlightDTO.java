package com.example.in_proj.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Date;
import java.sql.Time;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FlightDTO {
    private long id;
    private long avia_id;
    private Time departure_time;
    private Time arrival_time;
    private Date departure_date;
    private Date arrival_date;
    private boolean status;
    private long ticket_price;
    private long seats;
    private long occupied_seats;
    private long plane_id;
    private long departure_id;
    private long destination_id;
}
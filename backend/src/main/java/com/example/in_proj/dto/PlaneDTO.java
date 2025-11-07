package com.example.in_proj.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PlaneDTO {
    private long id;
    private String model;
    private long seats_number;
    private long avia_id;
}

package com.example.in_proj.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AirportDTO {
    private long id;
    private String name;
    private String city;
    private String code;
    private String country;
}

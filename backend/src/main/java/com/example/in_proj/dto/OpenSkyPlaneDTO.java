package com.example.in_proj.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OpenSkyPlaneDTO {
    private String icao24;
    private String callsign;
    private String originCountry;
    private Double longitude;
    private Double latitude;
    private Double altitude;
    private Double velocity;
    private Double heading;
}

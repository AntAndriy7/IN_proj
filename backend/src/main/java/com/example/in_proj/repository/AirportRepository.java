package com.example.in_proj.repository;

import com.example.in_proj.entity.Airport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AirportRepository extends JpaRepository<Airport, Long> {
    Airport findByName(String name);
    Airport findByCode(String code);
}

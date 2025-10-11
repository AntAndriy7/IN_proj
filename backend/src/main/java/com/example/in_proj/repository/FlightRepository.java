package com.example.in_proj.repository;

import com.example.in_proj.entity.Flight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FlightRepository extends JpaRepository<Flight, Long> {
    @Query("SELECT p FROM Flight p WHERE p.status = :status")
    List<Flight> findByStatus(Boolean status);
    @Query("SELECT p FROM Flight p WHERE p.avia_id = :avia_id")
    List<Flight> findByAviaId(Long avia_id);
}

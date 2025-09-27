package com.example.in_proj.repository;

import com.example.in_proj.entity.Plane;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlaneRepository extends JpaRepository<Plane, Long> {
    @Query("SELECT p FROM Plane p WHERE p.status = :status")
    List<Plane> findByStatus(Boolean status);
    @Query("SELECT p FROM Plane p WHERE p.avia_id = :avia_id")
    List<Plane> findByAviaId(Long avia_id);
}

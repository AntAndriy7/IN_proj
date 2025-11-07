package com.example.in_proj.repository;

import com.example.in_proj.entity.Plane;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlaneRepository extends JpaRepository<Plane, Long> {
    Plane findByModel(String model);
    @Query("SELECT p FROM Plane p WHERE p.avia_id = :aviaId")
    List<Plane> findByAvia_id(Long aviaId);
}

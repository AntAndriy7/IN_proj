package com.example.in_proj.repository;

import com.example.in_proj.entity.Bonus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BonusRepository extends JpaRepository<Bonus, Long> {
    @Query("SELECT b FROM Bonus b WHERE b.client_id = :clientId")
    List<Bonus> findAllByClientId(Long clientId);
    @Query("SELECT b FROM Bonus b WHERE b.client_id = :userId AND b.avia_id = :aviaId")
    Bonus findByUserIdAndAviaId(Long userId, Long aviaId);
}

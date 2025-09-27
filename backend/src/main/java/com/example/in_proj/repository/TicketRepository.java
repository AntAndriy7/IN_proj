package com.example.in_proj.repository;

import com.example.in_proj.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    @Query("SELECT t FROM Ticket t WHERE t.order_id = :order_id")
    List<Ticket> findByOrder_id(Long order_id);
}

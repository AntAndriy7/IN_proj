package com.example.in_proj.repository;

import com.example.in_proj.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    @Query("SELECT o FROM Order o WHERE o.client_id = :client_id")
    List<Order> findByClient_id(Long client_id);
    @Query("SELECT o FROM Order o WHERE o.plane_id = :plane_id")
    List<Order> findByPlane_id(Long plane_id);
    @Query("SELECT o FROM Order o WHERE o.plane_id = :plane_id AND o.payment_status IN :statuses")
    List<Order> findByPlane_idPayment_status(Long plane_id, List<String> statuses);
}

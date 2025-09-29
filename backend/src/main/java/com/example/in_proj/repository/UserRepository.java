package com.example.in_proj.repository;

import com.example.in_proj.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    @Query("SELECT u FROM User u WHERE u.recentActivity < :date")
    List<User> findByRecentActivityBefore(Date date);
    @Query("SELECT u FROM User u WHERE u.email = :email")
    User findByEmail(String email);
}

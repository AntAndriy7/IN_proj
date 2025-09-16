package com.example.in_proj.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "bonuses")
public class Bonus {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(name = "client_id")
    private long client_id;

    @Column(name = "avia_id")
    private long avia_id;

    @Column(name = "bonus_count")
    private long bonus_count;
}

package com.example.portfolio.project;

import com.example.portfolio.common.AuditableEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "technology")
public class Technology extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    protected Technology() {
        // required by JPA
    }

    public Technology(String name) {
        this.name = name;
    }

    public Long getId() { return id; }
    public String getName() { return name; }

    // Identity-based equality so entities behave correctly inside a Set.
    @Override
    public boolean equals(Object other) {
        return this == other || (other instanceof Technology t && id != null && id.equals(t.id));
    }

    @Override
    public int hashCode() {
        return Technology.class.hashCode();
    }
}

package com.example.portfolio.education;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CertificationRepository extends JpaRepository<Certification, Long> {

    List<Certification> findAllByOrderByIssuedOnDescIdDesc();
}

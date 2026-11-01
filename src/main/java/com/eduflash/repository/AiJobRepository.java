package com.eduflash.repository;

import com.eduflash.entity.AiJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AiJobRepository extends JpaRepository<AiJob, Long> {
}

package com.eduflash.repository;

import com.eduflash.entity.QuizSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuizSessionRepository extends JpaRepository<QuizSession, Long> {
    Page<QuizSession> findByUserIdOrderByCompletedAtDesc(Long userId, Pageable pageable);
    long countByUserId(Long userId);
}

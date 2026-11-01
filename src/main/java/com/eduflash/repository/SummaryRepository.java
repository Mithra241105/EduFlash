package com.eduflash.repository;

import com.eduflash.entity.Summary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SummaryRepository extends JpaRepository<Summary, Long> {
    java.util.Optional<Summary> findByDocumentId(Long documentId);
}

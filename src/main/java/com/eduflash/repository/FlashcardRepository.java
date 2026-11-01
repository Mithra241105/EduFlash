package com.eduflash.repository;

import com.eduflash.entity.Flashcard;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {
    @EntityGraph(attributePaths = {"topic", "document"})
    List<Flashcard> findByTopicId(Long topicId);

    @EntityGraph(attributePaths = {"topic", "document"})
    Page<Flashcard> findByTopicId(Long topicId, Pageable pageable);

    @EntityGraph(attributePaths = {"topic", "document"})
    List<Flashcard> findByTopicIdIn(Collection<Long> topicIds);

    int countByTopicId(Long topicId);
}

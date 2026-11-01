package com.eduflash.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "quiz_sessions")
public class QuizSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User user;

    /** Comma-separated topic IDs used in this session */
    @Column(name = "topic_ids", nullable = false)
    private String topicIds;

    /** Topic names for display purposes */
    @Column(name = "topic_names", nullable = false, columnDefinition = "TEXT")
    private String topicNames;

    @Column(name = "session_type", nullable = false)
    private String sessionType; // FLASHCARD or QUIZ

    @Column(name = "total_cards", nullable = false)
    private Integer totalCards;

    @Column(name = "correct_count", nullable = false)
    @Builder.Default
    private Integer correctCount = 0;

    @Column(name = "incorrect_count", nullable = false)
    @Builder.Default
    private Integer incorrectCount = 0;

    @Column(name = "score_percent", nullable = false)
    @Builder.Default
    private Integer scorePercent = 0;

    @Column(name = "completed_at", nullable = false)
    @Builder.Default
    private Timestamp completedAt = new Timestamp(System.currentTimeMillis());

    @Column(name = "duration_seconds")
    private Integer durationSeconds;
}

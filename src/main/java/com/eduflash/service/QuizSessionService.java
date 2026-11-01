package com.eduflash.service;

import com.eduflash.dto.CompleteSessionRequest;
import com.eduflash.dto.StartSessionRequest;
import com.eduflash.entity.Flashcard;
import com.eduflash.entity.QuizSession;
import com.eduflash.entity.Topic;
import com.eduflash.entity.User;
import com.eduflash.repository.FlashcardRepository;
import com.eduflash.repository.QuizSessionRepository;
import com.eduflash.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuizSessionService {

    private final QuizSessionRepository quizSessionRepository;
    private final FlashcardRepository flashcardRepository;
    private final TopicRepository topicRepository;

    /**
     * Get flashcards for given topic IDs, shuffled for session.
     */
    @Transactional(readOnly = true)
    public List<Flashcard> getFlashcardsForTopics(List<Long> topicIds) {
        List<Flashcard> all = new ArrayList<>(flashcardRepository.findByTopicIdIn(topicIds));
        Collections.shuffle(all);
        return all;
    }

    /**
     * Save a completed session and return the saved entity.
     */
    @Transactional
    public QuizSession completeSession(User user, StartSessionRequest startReq, CompleteSessionRequest completeReq) {
        // Resolve topic names
        List<Topic> topics = topicRepository.findAllById(startReq.getTopicIds());
        String topicIds = startReq.getTopicIds().stream()
                .map(String::valueOf)
                .collect(Collectors.joining(","));
        String topicNames = topics.stream()
                .map(Topic::getName)
                .collect(Collectors.joining(", "));

        int total = completeReq.getCorrectCount() + completeReq.getIncorrectCount();
        int pct = total > 0 ? Math.round((completeReq.getCorrectCount() * 100f) / total) : 0;

        QuizSession session = QuizSession.builder()
                .user(user)
                .topicIds(topicIds)
                .topicNames(topicNames)
                .sessionType(startReq.getSessionType() != null ? startReq.getSessionType() : "FLASHCARD")
                .totalCards(total)
                .correctCount(completeReq.getCorrectCount())
                .incorrectCount(completeReq.getIncorrectCount())
                .scorePercent(pct)
                .durationSeconds(completeReq.getDurationSeconds())
                .build();

        return quizSessionRepository.save(session);
    }

    @Transactional(readOnly = true)
    public Page<QuizSession> getHistory(Long userId, Pageable pageable) {
        return quizSessionRepository.findByUserIdOrderByCompletedAtDesc(userId, pageable);
    }
}

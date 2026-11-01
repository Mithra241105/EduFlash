package com.eduflash.controller;

import com.eduflash.dto.CompleteSessionRequest;
import com.eduflash.dto.StartSessionRequest;
import com.eduflash.entity.Flashcard;
import com.eduflash.entity.QuizSession;
import com.eduflash.entity.User;
import com.eduflash.service.QuizSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class QuizSessionController {

    private final QuizSessionService quizSessionService;

    /**
     * Fetch shuffled flashcards for one or more topics (multi-topic combo).
     * GET /api/sessions/flashcards?topicIds=1,2,3
     */
    @GetMapping("/flashcards")
    public ResponseEntity<List<Flashcard>> getSessionFlashcards(
            @RequestParam List<Long> topicIds,
            @AuthenticationPrincipal User user) {
        List<Flashcard> cards = quizSessionService.getFlashcardsForTopics(topicIds);
        return ResponseEntity.ok(cards);
    }

    /**
     * Save a completed session.
     * POST /api/sessions/complete
     */
    @PostMapping("/complete")
    public ResponseEntity<QuizSession> completeSession(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User user) {
        StartSessionRequest startReq = new StartSessionRequest();
        @SuppressWarnings("unchecked")
        List<Integer> rawIds = (List<Integer>) body.get("topicIds");
        startReq.setTopicIds(rawIds.stream().map(Long::valueOf).toList());
        startReq.setSessionType((String) body.get("sessionType"));

        CompleteSessionRequest completeReq = new CompleteSessionRequest();
        completeReq.setCorrectCount((Integer) body.get("correctCount"));
        completeReq.setIncorrectCount((Integer) body.get("incorrectCount"));
        completeReq.setDurationSeconds((Integer) body.get("durationSeconds"));

        QuizSession session = quizSessionService.completeSession(user, startReq, completeReq);
        return ResponseEntity.ok(session);
    }

    /**
     * Get session history for the authenticated user.
     * GET /api/sessions/history
     */
    @GetMapping("/history")
    public ResponseEntity<Page<QuizSession>> getHistory(
            @AuthenticationPrincipal User user,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<QuizSession> history = quizSessionService.getHistory(user.getId(), pageable);
        return ResponseEntity.ok(history);
    }
}

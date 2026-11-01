package com.eduflash.controller;

import com.eduflash.dto.ReviewRequest;
import com.eduflash.entity.Flashcard;
import com.eduflash.entity.User;
import com.eduflash.service.PracticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/practice")
@RequiredArgsConstructor
public class PracticeController {

    private final PracticeService practiceService;

    @PostMapping("/flashcards/{flashcardId}/review")
    public ResponseEntity<Flashcard> reviewFlashcard(
            @PathVariable Long flashcardId,
            @RequestBody ReviewRequest reviewRequest,
            @AuthenticationPrincipal User user) {
        
        Flashcard updatedFlashcard = practiceService.reviewFlashcard(flashcardId, user.getId(), reviewRequest.isCorrect());
        return ResponseEntity.ok(updatedFlashcard);
    }

    @GetMapping("/topics/{topicId}/flashcards")
    public ResponseEntity<Page<Flashcard>> getFlashcards(
            @PathVariable Long topicId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(practiceService.getFlashcardsByTopic(topicId, pageable));
    }
}

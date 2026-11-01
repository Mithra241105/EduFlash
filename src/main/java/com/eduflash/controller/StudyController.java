package com.eduflash.controller;

import com.eduflash.entity.Topic;
import com.eduflash.entity.User;
import com.eduflash.service.AiStudyService;
import com.eduflash.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/study")
@RequiredArgsConstructor
public class StudyController {

    private final AiStudyService aiStudyService;
    private final TopicRepository topicRepository;
    private final com.eduflash.repository.SummaryRepository summaryRepository;
    private final com.eduflash.repository.FlashcardRepository flashcardRepository;

    @GetMapping("/documents/{documentId}/topics")
    public ResponseEntity<List<com.eduflash.dto.TopicDto>> getTopics(
            @PathVariable Long documentId,
            @AuthenticationPrincipal User user) {
        
        List<com.eduflash.dto.TopicDto> topics = topicRepository.findByDocumentId(documentId)
                .stream().map(this::mapToTopicDto).toList();
        return ResponseEntity.ok(topics);
    }

    @GetMapping("/topics")
    public ResponseEntity<List<com.eduflash.dto.TopicDto>> getAllUserTopics(
            @AuthenticationPrincipal User user) {
        List<com.eduflash.dto.TopicDto> topics = topicRepository.findByDocumentUserId(user.getId())
                .stream().map(this::mapToTopicDto).toList();
        return ResponseEntity.ok(topics);
    }

    private com.eduflash.dto.TopicDto mapToTopicDto(Topic topic) {
        int count = flashcardRepository.countByTopicId(topic.getId());
        return com.eduflash.dto.TopicDto.builder()
                .id(topic.getId())
                .name(topic.getName())
                .description(topic.getDescription())
                .category(topic.getCategory())
                .importance(topic.getImportance())
                .masteryLevel(topic.getMasteryLevel())
                .documentId(topic.getDocument() != null ? topic.getDocument().getId() : null)
                .documentTitle(topic.getDocument() != null ? topic.getDocument().getTitle() : null)
                .flashcardCount(count)
                .build();
    }

    @GetMapping("/documents/{documentId}/summary")
    public ResponseEntity<com.eduflash.entity.Summary> getSummary(
            @PathVariable Long documentId,
            @AuthenticationPrincipal User user) {
        
        return summaryRepository.findByDocumentId(documentId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/documents/{documentId}/extract-topics")
    public ResponseEntity<com.eduflash.entity.AiJob> extractTopics(
            @PathVariable Long documentId,
            @AuthenticationPrincipal User user) {
        
        com.eduflash.entity.AiJob job = aiStudyService.createJob("EXTRACT_TOPICS", user.getId());
        aiStudyService.processExtractTopics(documentId, user.getId(), job.getId());
        return ResponseEntity.accepted().body(job);
    }

    @PostMapping("/topics/{topicId}/flashcards")
    public ResponseEntity<com.eduflash.entity.AiJob> generateFlashcards(
            @PathVariable Long topicId,
            @AuthenticationPrincipal User user) {

        com.eduflash.entity.AiJob job = aiStudyService.createJob("GENERATE_FLASHCARDS", user.getId());
        aiStudyService.processGenerateFlashcards(topicId, user.getId(), job.getId());
        return ResponseEntity.accepted().body(job);
    }

    @PostMapping("/documents/{documentId}/summarize")
    public ResponseEntity<com.eduflash.entity.AiJob> generateSummary(
            @PathVariable Long documentId,
            @RequestParam(defaultValue = "INTERMEDIATE") String readingLevel,
            @RequestParam(required = false) List<Long> topicIds,
            @AuthenticationPrincipal User user) {

        com.eduflash.entity.AiJob job = aiStudyService.createJob("GENERATE_SUMMARY", user.getId());
        aiStudyService.processGenerateSummary(documentId, readingLevel, topicIds, user.getId(), job.getId());
        return ResponseEntity.accepted().body(job);
    }
}

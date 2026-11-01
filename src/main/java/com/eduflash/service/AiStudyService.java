package com.eduflash.service;

import com.eduflash.dto.NemotronFlashcardResponse;
import com.eduflash.dto.NemotronTopicResponse;
import com.eduflash.entity.*;
import com.eduflash.repository.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AiStudyService {

    private final DocumentRepository documentRepository;
    private final TopicRepository topicRepository;
    private final FlashcardRepository flashcardRepository;
    private final SummaryRepository summaryRepository;
    private final PdfExtractionService pdfExtractionService;
    private final NemotronAIService nemotronAIService;
    private final ObjectMapper objectMapper;
    private final AiJobRepository aiJobRepository;
    private final UserRepository userRepository;

    @Transactional
    public AiJob createJob(String jobType, Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        AiJob job = AiJob.builder()
                .status(JobStatus.PENDING)
                .jobType(jobType)
                .createdAt(LocalDateTime.now())
                .user(user)
                .build();
        return aiJobRepository.save(job);
    }

    @Async
    @Transactional
    public void processExtractTopics(Long documentId, Long userId, Long jobId) {
        AiJob job = aiJobRepository.findById(jobId).orElseThrow();
        try {
            extractAndSaveTopics(documentId, userId);
            job.setStatus(JobStatus.COMPLETED);
            job.setResultMessage("Topics extracted successfully");
        } catch (Exception e) {
            job.setStatus(JobStatus.FAILED);
            job.setResultMessage(e.getMessage() != null ? e.getMessage() : e.toString());
        }
        aiJobRepository.save(job);
    }

    @Async
    @Transactional
    public void processGenerateFlashcards(Long topicId, Long userId, Long jobId) {
        AiJob job = aiJobRepository.findById(jobId).orElseThrow();
        try {
            generateFlashcardsForTopic(topicId, userId);
            job.setStatus(JobStatus.COMPLETED);
            job.setResultMessage("Flashcards generated successfully");
        } catch (Exception e) {
            job.setStatus(JobStatus.FAILED);
            job.setResultMessage(e.getMessage() != null ? e.getMessage() : e.toString());
        }
        aiJobRepository.save(job);
    }

    @Async
    @Transactional
    public void processGenerateSummary(Long documentId, String readingLevel, List<Long> topicIds, Long userId, Long jobId) {
        AiJob job = aiJobRepository.findById(jobId).orElseThrow();
        try {
            generateDocumentSummary(documentId, readingLevel, topicIds, userId);
            job.setStatus(JobStatus.COMPLETED);
            job.setResultMessage("Summary generated successfully");
        } catch (Exception e) {
            job.setStatus(JobStatus.FAILED);
            job.setResultMessage(e.getMessage() != null ? e.getMessage() : e.toString());
        }
        aiJobRepository.save(job);
    }

    @Transactional
    public List<Topic> extractAndSaveTopics(Long documentId, Long userId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        if (!document.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized: You do not own this document.");
        }

        // Return existing if already extracted
        if (Boolean.TRUE.equals(document.getTopicsExtracted())) {
            return topicRepository.findByDocumentId(documentId);
        }

        String rawText = pdfExtractionService.extractTextFromPdf(document.getLocalFilePath());
        String chunkedText = pdfExtractionService.chunkText(rawText, 10000);

        String jsonResponse = nemotronAIService.extractTopicsFromJson(chunkedText);

        List<Topic> savedTopics = new ArrayList<>();
        try {
            NemotronTopicResponse response = objectMapper.readValue(jsonResponse, NemotronTopicResponse.class);
            if (response != null && response.getTopics() != null) {
                for (NemotronTopicResponse.TopicDto dto : response.getTopics()) {
                    Topic topic = Topic.builder()
                            .name(dto.getName())
                            .description(dto.getDescription())
                            .category(dto.getCategory())
                            .importance(parseImportance(dto.getImportance()))
                            .document(document)
                            .masteryLevel(0)
                            .build();
                    savedTopics.add(topic);
                }
            }
            
            if (!savedTopics.isEmpty()) {
                topicRepository.saveAll(savedTopics);
            }

            document.setTopicsExtracted(true);
            documentRepository.save(document);

        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse AI response: " + e.getMessage(), e);
        }

        return savedTopics;
    }

    @Transactional
    public List<Flashcard> generateFlashcardsForTopic(Long topicId, Long userId) {
        // Use explicit JOIN FETCH to eagerly load document and user, 
        // avoiding LazyInitializationException in async contexts
        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new RuntimeException("Topic not found"));

        // Force-load document and user within this transaction
        Document document = documentRepository.findById(topic.getDocument().getId())
                .orElseThrow(() -> new RuntimeException("Document not found"));
        User docUser = userRepository.findById(document.getUser().getId())
                .orElseThrow(() -> new RuntimeException("Document owner not found"));

        if (!docUser.getId().equals(userId)) {
            throw new RuntimeException("Unauthorized: You do not own the associated document.");
        }

        List<Flashcard> existingFlashcards = flashcardRepository.findByTopicId(topicId);
        if (!existingFlashcards.isEmpty()) {
            return existingFlashcards;
        }

        String rawText = pdfExtractionService.extractTextFromPdf(document.getLocalFilePath());
        String chunkedText = pdfExtractionService.chunkText(rawText, 10000);

        String jsonResponse = nemotronAIService.generateFlashcardsFromJson(topic.getName(), topic.getDescription(), chunkedText);

        List<Flashcard> savedFlashcards = new ArrayList<>();
        try {
            NemotronFlashcardResponse response = objectMapper.readValue(jsonResponse, NemotronFlashcardResponse.class);
            if (response != null && response.getFlashcards() != null) {
                for (NemotronFlashcardResponse.FlashcardDto dto : response.getFlashcards()) {
                    Flashcard flashcard = Flashcard.builder()
                            .question(dto.getQuestion())
                            .answer(dto.getAnswer())
                            .difficulty(parseDifficulty(dto.getDifficulty()))
                            .topic(topic)
                            .document(document)
                            .masteryLevel(0)
                            .timesReviewed(0)
                            .build();
                    savedFlashcards.add(flashcard);
                }
            }

            if (!savedFlashcards.isEmpty()) {
                flashcardRepository.saveAll(savedFlashcards);
            }

        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse AI flashcard response: " + e.getMessage(), e);
        }

        return savedFlashcards;
    }

    @Transactional
    public Summary generateDocumentSummary(Long documentId, String readingLevelStr, List<Long> topicIds, Long userId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        if (!document.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized: You do not own this document.");
        }

        ReadingLevel readingLevel = parseReadingLevel(readingLevelStr);

        List<String> topicNames = new ArrayList<>();
        if (topicIds != null && !topicIds.isEmpty()) {
            List<Topic> topics = topicRepository.findAllById(topicIds);
            for (Topic t : topics) {
                if (t.getDocument().getId().equals(documentId)) {
                    topicNames.add(t.getName());
                }
            }
        }

        String rawText = pdfExtractionService.extractTextFromPdf(document.getLocalFilePath());
        String chunkedText = pdfExtractionService.chunkText(rawText, 10000);

        String markdown = nemotronAIService.generateSummary(chunkedText, readingLevel.name(), topicNames);

        int wordCount = 0;
        if (markdown != null && !markdown.isEmpty()) {
            wordCount = markdown.split("\\s+").length;
        }

        Summary summary = Summary.builder()
                .document(document)
                .readingLevel(readingLevel)
                .summaryMarkdown(markdown)
                .wordCount(wordCount)
                .build();

        Summary savedSummary = summaryRepository.save(summary);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setTotalXp(user.getTotalXp() + 50);
        userRepository.save(user);

        return savedSummary;
    }

    private Importance parseImportance(String val) {
        if (val == null) return Importance.MEDIUM;
        try {
            return Importance.valueOf(val.toUpperCase());
        } catch (IllegalArgumentException e) {
            return Importance.MEDIUM;
        }
    }

    private Difficulty parseDifficulty(String val) {
        if (val == null) return Difficulty.MEDIUM;
        try {
            return Difficulty.valueOf(val.toUpperCase());
        } catch (IllegalArgumentException e) {
            return Difficulty.MEDIUM;
        }
    }

    private ReadingLevel parseReadingLevel(String val) {
        if (val == null) return ReadingLevel.INTERMEDIATE;
        try {
            return ReadingLevel.valueOf(val.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ReadingLevel.INTERMEDIATE;
        }
    }
}

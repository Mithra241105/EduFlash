package com.eduflash.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;

@Service
public class NemotronAIService {

    private final RestClient restClient;
    private final String model;
    private final ObjectMapper objectMapper;

    public NemotronAIService(
            @Value("${ai.nvidia.nemotron.base-url}") String baseUrl,
            @Value("${ai.nvidia.nemotron.api-key}") String apiKey,
            @Value("${ai.nvidia.nemotron.model}") String model,
            RestClient.Builder restClientBuilder,
            ObjectMapper objectMapper) {

        this.model = model;
        this.objectMapper = objectMapper;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setReadTimeout(90000); // 90 seconds (Nemotron can take a while)
        factory.setConnectTimeout(10000); // 10 seconds

        this.restClient = restClientBuilder
                .requestFactory(factory)
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                // Accept all so Spring doesn't crash if NVIDIA returns octet-stream
                .defaultHeader(HttpHeaders.ACCEPT, "*/*") 
                .build();
    }

    public String extractTopicsFromJson(String documentText) {
        String systemPrompt = "You are an educational expert. Extract 8-12 key educational topics from the provided document text. " +
                "Output strictly valid JSON and nothing else. Ensure every item inside the array is a JSON object wrapped in curly braces {}. " +
                "Do NOT use square brackets [] for objects. Schema must exactly match: " +
                "{\"topics\": [{\"name\": \"...\", \"description\": \"...\", \"category\": \"...\", \"importance\": \"LOW|MEDIUM|HIGH|CRITICAL\"}]}.";

        Map<String, Object> requestBody = Map.of(
                "model", this.model,
                "temperature", 0.2,
                "top_p", 0.95,
                "max_tokens", 16384,
                "chat_template_kwargs", Map.of("enable_thinking", true),
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", documentText)
                )
        );

        try {
            // Read as raw string to avoid Content-Type strictness issues (octet-stream crashes)
            String rawResponse = executeWithRetry(() -> restClient.post()
                    .uri("/chat/completions")
                    .body(requestBody)
                    .retrieve()
                    .body(String.class));

            Map response = objectMapper.readValue(rawResponse, Map.class);

            if (response != null && response.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    if (message != null && message.containsKey("content")) {
                        String content = (String) message.get("content");
                        return cleanJsonContent(content);
                    }
                }
            }
            return "{\"topics\": []}"; // Fallback empty JSON
        } catch (Exception e) {
            throw new RuntimeException("Failed to extract topics from AI API: " + e.getMessage(), e);
        }
    }

    public String generateFlashcardsFromJson(String topicName, String topicDescription, String documentContext) {
        String systemPrompt = "You are a strict educational assessment creator. Generate 5 to 10 interactive study flashcards " +
                "for the following topic. Output strictly valid JSON and nothing else. Ensure every flashcard is a JSON object wrapped in curly braces {}. " +
                "Do NOT use square brackets [] for objects. Schema must exactly match: " +
                "{\"flashcards\": [{\"question\": \"...\", \"answer\": \"...\", \"difficulty\": \"EASY|MEDIUM|HARD\"}]}.";

        String userPrompt = String.format("Topic Name: %s\nTopic Description: %s\nContext: %s", topicName, topicDescription, documentContext);

        Map<String, Object> requestBody = Map.of(
                "model", this.model,
                "temperature", 0.2,
                "top_p", 0.95,
                "max_tokens", 16384,
                "chat_template_kwargs", Map.of("enable_thinking", true),
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userPrompt)
                )
        );

        try {
            String rawResponse = executeWithRetry(() -> restClient.post()
                    .uri("/chat/completions")
                    .body(requestBody)
                    .retrieve()
                    .body(String.class));

            Map response = objectMapper.readValue(rawResponse, Map.class);

            if (response != null && response.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    if (message != null && message.containsKey("content")) {
                        String content = (String) message.get("content");
                        return cleanJsonContent(content);
                    }
                }
            }
            return "{\"flashcards\": []}"; // Fallback empty JSON
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate flashcards from AI API: " + e.getMessage(), e);
        }
    }

    public String generateSummary(String documentText, String readingLevel, List<String> topicNames) {
        String systemPrompt;
        if (topicNames == null || topicNames.isEmpty()) {
            systemPrompt = String.format("You are an educational expert. Summarize the following document text " +
                    "for a %s audience. Output pure Markdown text formatted with clear headings, bullet points, and a tone " +
                    "matching the requested reading level. Do NOT output JSON.", readingLevel);
        } else {
            String topicsStr = String.join(", ", topicNames);
            systemPrompt = String.format("You are an educational expert. Create a comprehensive summary from the following document text, " +
                    "but focus EXCLUSIVELY on the following selected topics: [%s]. " +
                    "For a %s audience. Output pure Markdown text formatted with clear headings, bullet points, and a tone " +
                    "matching the requested reading level. Do NOT output JSON.", topicsStr, readingLevel);
        }

        Map<String, Object> requestBody = Map.of(
                "model", this.model,
                "temperature", 0.3,
                "top_p", 0.95,
                "max_tokens", 16384,
                "chat_template_kwargs", Map.of("enable_thinking", true),
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", documentText)
                )
        );

        try {
            String rawResponse = executeWithRetry(() -> restClient.post()
                    .uri("/chat/completions")
                    .body(requestBody)
                    .retrieve()
                    .body(String.class));

            Map response = objectMapper.readValue(rawResponse, Map.class);

            if (response != null && response.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    if (message != null && message.containsKey("content")) {
                        return (String) message.get("content");
                    }
                }
            }
            return ""; // Fallback empty
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate summary from AI API: " + e.getMessage(), e);
        }
    }

    private <T> T executeWithRetry(java.util.function.Supplier<T> apiCall) {
        int maxRetries = 3;
        int delayMs = 5000;

        for (int i = 0; i < maxRetries; i++) {
            try {
                return apiCall.get();
            } catch (RestClientException e) {
                String errorMsg = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
                if (i < maxRetries - 1 && (errorMsg.contains("503") || errorMsg.contains("429") || errorMsg.contains("overloaded"))) {
                    try {
                        System.out.println("NVIDIA API overloaded (503/429). Retrying in " + (delayMs / 1000) + " seconds...");
                        Thread.sleep(delayMs);
                        delayMs *= 2; // Exponential backoff
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("API retry interrupted", ie);
                    }
                } else {
                    throw e; // Throw original exception if out of retries or not a retryable error
                }
            }
        }
        return null; // Should not reach here
    }

    private String cleanJsonContent(String content) {
        if (content == null) return null;
        content = content.trim();
        if (content.startsWith("```json")) {
            content = content.substring(7);
        } else if (content.startsWith("```")) {
            content = content.substring(3);
        }
        if (content.endsWith("```")) {
            content = content.substring(0, content.length() - 3);
        }
        return content.trim();
    }
}

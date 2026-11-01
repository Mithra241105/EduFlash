package com.eduflash.dto;

import lombok.Data;
import java.util.List;

@Data
public class StartSessionRequest {
    private List<Long> topicIds;
    private String sessionType; // FLASHCARD or QUIZ
}

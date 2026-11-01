package com.eduflash.dto;

import lombok.Data;
import java.util.List;

@Data
public class NemotronFlashcardResponse {
    private List<FlashcardDto> flashcards;

    @Data
    public static class FlashcardDto {
        private String question;
        private String answer;
        private String difficulty;
    }
}

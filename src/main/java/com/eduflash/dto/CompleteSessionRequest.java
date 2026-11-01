package com.eduflash.dto;

import lombok.Data;

@Data
public class CompleteSessionRequest {
    private Integer correctCount;
    private Integer incorrectCount;
    private Integer durationSeconds;
}

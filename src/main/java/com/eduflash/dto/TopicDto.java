package com.eduflash.dto;

import com.eduflash.entity.Importance;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopicDto {
    private Long id;
    private String name;
    private String description;
    private String category;
    private Importance importance;
    private Integer masteryLevel;
    private Long documentId;
    private String documentTitle;
    private Integer flashcardCount;
}

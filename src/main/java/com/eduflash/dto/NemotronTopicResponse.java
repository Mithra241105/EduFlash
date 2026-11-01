package com.eduflash.dto;

import lombok.Data;
import java.util.List;

@Data
public class NemotronTopicResponse {
    private List<TopicDto> topics;

    @Data
    public static class TopicDto {
        private String name;
        private String description;
        private String category;
        private String importance;
    }
}

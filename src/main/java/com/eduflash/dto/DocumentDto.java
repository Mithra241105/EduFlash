package com.eduflash.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentDto {
    private Long id;
    private String title;
    private String fileName;
    private Long fileSizeBytes;
    private String mimeType;
    private Boolean topicsExtracted;
    private Long folderId;
}

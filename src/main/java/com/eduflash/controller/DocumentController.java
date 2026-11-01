package com.eduflash.controller;

import com.eduflash.dto.DocumentDto;
import com.eduflash.entity.User;
import com.eduflash.repository.UserRepository;
import com.eduflash.entity.AiJob;
import com.eduflash.service.AiStudyService;
import com.eduflash.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final FileStorageService fileStorageService;
    private final UserRepository userRepository;
    private final AiStudyService aiStudyService;

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @PostMapping("/upload")
    public ResponseEntity<DocumentDto> uploadPdf(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folderId", required = false) Long folderId) {
        
        User user = getAuthenticatedUser();
        DocumentDto response = fileStorageService.uploadPdf(file, folderId, user);
        
        // Kick off asynchronous AI topic extraction
        AiJob job = aiStudyService.createJob("EXTRACT_TOPICS", user.getId());
        aiStudyService.processExtractTopics(response.getId(), user.getId(), job.getId());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/folder/{folderId}")
    public ResponseEntity<List<DocumentDto>> getDocumentsByFolder(@PathVariable Long folderId) {
        User user = getAuthenticatedUser();
        List<DocumentDto> documents = fileStorageService.getDocumentsByFolder(folderId, user);
        return ResponseEntity.ok(documents);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentDto> getDocument(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(fileStorageService.getDocument(id, user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DocumentDto> updateDocument(@PathVariable Long id, @RequestBody Map<String, String> request) {
        User user = getAuthenticatedUser();
        String title = request.get("title");
        return ResponseEntity.ok(fileStorageService.updateDocument(id, title, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        fileStorageService.deleteDocument(id, user);
        return ResponseEntity.noContent().build();
    }
}

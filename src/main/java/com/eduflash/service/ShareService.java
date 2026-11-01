package com.eduflash.service;

import com.eduflash.dto.DocumentDto;
import com.eduflash.entity.AccessPermission;
import com.eduflash.entity.Document;
import com.eduflash.entity.SharedLink;
import com.eduflash.entity.User;
import com.eduflash.repository.DocumentRepository;
import com.eduflash.repository.SharedLinkRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
public class ShareService {

    private final SharedLinkRepository sharedLinkRepository;
    private final DocumentRepository documentRepository;

    public ShareService(SharedLinkRepository sharedLinkRepository, DocumentRepository documentRepository) {
        this.sharedLinkRepository = sharedLinkRepository;
        this.documentRepository = documentRepository;
    }

    @Transactional
    public String generateShareLink(Long documentId, User user) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        if (!document.getUser().getId().equals(user.getId())) {
            throw new IllegalStateException("Only the owner can share this document");
        }

        String token = generateToken();

        SharedLink sharedLink = SharedLink.builder()
                .shareToken(token)
                .accessPermission(AccessPermission.VIEW_ONLY)
                .expiresAt(LocalDateTime.now().plusDays(7)) // Arbitrary 7 days expiry
                .document(document)
                .sharedBy(user)
                .build();

        sharedLinkRepository.save(sharedLink);

        return token;
    }

    @Transactional(readOnly = true)
    public DocumentDto resolveShareLink(String token) {
        SharedLink link = sharedLinkRepository.findByShareToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired share link"));

        if (link.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Share link has expired");
        }

        Document document = link.getDocument();
        return DocumentDto.builder()
                .id(document.getId())
                .title(document.getTitle())
                .fileName(document.getFileName())
                .fileSizeBytes(document.getFileSizeBytes())
                .mimeType(document.getMimeType())
                .topicsExtracted(document.getTopicsExtracted())
                .folderId(document.getFolder() != null ? document.getFolder().getId() : null)
                .build();
    }

    private String generateToken() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[48]; // 48 bytes -> Base64 is 64 chars
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}

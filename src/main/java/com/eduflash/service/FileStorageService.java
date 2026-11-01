package com.eduflash.service;

import com.eduflash.dto.DocumentDto;
import com.eduflash.entity.Document;
import com.eduflash.entity.Folder;
import com.eduflash.entity.User;
import com.eduflash.exception.StorageQuotaExceededException;
import com.eduflash.repository.DocumentRepository;
import com.eduflash.repository.FolderRepository;
import com.eduflash.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    private final DocumentRepository documentRepository;
    private final FolderRepository folderRepository;
    private final UserRepository userRepository;

    private static final String STORAGE_ROOT = "./storage/uploads/";

    @Transactional(rollbackFor = Exception.class)
    public DocumentDto uploadPdf(MultipartFile file, Long folderId, User user) {
        if (!"application/pdf".equals(file.getContentType())) {
            throw new IllegalArgumentException("Only PDF files are allowed");
        }

        Folder folder = null;
        if (folderId != null) {
            folder = folderRepository.findById(folderId)
                    .orElseThrow(() -> new IllegalArgumentException("Folder not found"));
            if (!folder.getUser().getId().equals(user.getId())) {
                throw new IllegalArgumentException("Not authorized to upload to this folder");
            }
        }

        long newSize = user.getStorageUsedBytes() + file.getSize();
        if (newSize > user.getStorageLimitBytes()) {
            throw new StorageQuotaExceededException("Storage quota exceeded. Please free up some space.");
        }

        String uuid = UUID.randomUUID().toString();
        String localFilePath = STORAGE_ROOT + user.getId() + "/" + uuid + ".pdf";
        Path targetPath = Paths.get(localFilePath);

        try {
            Files.createDirectories(targetPath.getParent());
            file.transferTo(targetPath);

            Document document = Document.builder()
                    .title(file.getOriginalFilename() != null ? file.getOriginalFilename() : "Untitled Document")
                    .fileName(uuid + ".pdf")
                    .localFilePath(localFilePath)
                    .fileSizeBytes(file.getSize())
                    .mimeType(file.getContentType())
                    .user(user)
                    .folder(folder)
                    .topicsExtracted(false)
                    .build();

            Document savedDocument = documentRepository.save(document);

            user.setStorageUsedBytes(newSize);
            userRepository.save(user);

            return mapToDto(savedDocument);
        } catch (Exception e) {
            // Atomic rollback logic: delete physical file if DB operations fail
            try {
                Files.deleteIfExists(targetPath);
            } catch (IOException ioException) {
                // Log the exception in a real app
                System.err.println("Failed to delete physical file during rollback: " + ioException.getMessage());
            }
            throw new RuntimeException("Failed to upload file: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public List<DocumentDto> getDocumentsByFolder(Long folderId, User user) {
        // Verify folder exists and belongs to user
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found"));
        if (!folder.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not authorized to view this folder");
        }

        return documentRepository.findByFolderId(folderId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DocumentDto getDocument(Long id, User user) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));
        if (!document.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not authorized to view this document");
        }
        return mapToDto(document);
    }

    @Transactional
    public DocumentDto updateDocument(Long id, String newTitle, User user) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));
        if (!document.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not authorized to update this document");
        }
        document.setTitle(newTitle);
        return mapToDto(documentRepository.save(document));
    }

    @Transactional
    public void deleteDocument(Long id, User user) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));
        if (!document.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not authorized to delete this document");
        }

        try {
            Files.deleteIfExists(Paths.get(document.getLocalFilePath()));
        } catch (IOException e) {
            System.err.println("Warning: Failed to delete physical file " + document.getLocalFilePath());
        }

        long newSize = user.getStorageUsedBytes() - document.getFileSizeBytes();
        if (newSize < 0) newSize = 0;
        user.setStorageUsedBytes(newSize);
        userRepository.save(user);

        documentRepository.delete(document);
    }

    private DocumentDto mapToDto(Document document) {
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
}

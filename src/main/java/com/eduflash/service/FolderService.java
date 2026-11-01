package com.eduflash.service;

import com.eduflash.dto.FolderCreateRequest;
import com.eduflash.dto.FolderDto;
import com.eduflash.entity.Folder;
import com.eduflash.entity.User;
import com.eduflash.repository.FolderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

import com.eduflash.repository.DocumentRepository;

@Service
@RequiredArgsConstructor
public class FolderService {

    private final FolderRepository folderRepository;
    private final DocumentRepository documentRepository;

    @Transactional(readOnly = true)
    public Page<FolderDto> getAllFoldersByUser(User user, Pageable pageable) {
        if ("STUDENT".equals(user.getRole().name())) {
            return folderRepository.findOwnedOrClassroomFoldersByUserId(user.getId(), pageable)
                    .map(this::mapToDto);
        }
        return folderRepository.findByUserId(user.getId(), pageable)
                .map(this::mapToDto);
    }

    @Transactional
    public FolderDto createFolder(FolderCreateRequest request, User user) {
        Folder folder = Folder.builder()
                .name(request.getName())
                .subject(request.getSubject())
                .colorCode(request.getColorCode())
                .user(user)
                .build();
        Folder savedFolder = folderRepository.save(folder);
        return mapToDto(savedFolder);
    }

    @Transactional
    public FolderDto updateFolder(Long id, FolderCreateRequest request, User user) {
        Folder folder = folderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Folder not found"));
        
        if (!folder.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Not authorized to update this folder");
        }

        folder.setName(request.getName());
        folder.setSubject(request.getSubject());
        folder.setColorCode(request.getColorCode());

        Folder updatedFolder = folderRepository.save(folder);
        return mapToDto(updatedFolder);
    }

    @Transactional
    public void deleteFolder(Long id, User user) {
        Folder folder = folderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Folder not found"));

        if (!folder.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Not authorized to delete this folder");
        }

        folderRepository.delete(folder);
    }

    private FolderDto mapToDto(Folder folder) {
        int docCount = documentRepository.countByFolderId(folder.getId());
        return FolderDto.builder()
                .id(folder.getId())
                .name(folder.getName())
                .subject(folder.getSubject())
                .colorCode(folder.getColorCode())
                .documentCount(docCount)
                .build();
    }
}

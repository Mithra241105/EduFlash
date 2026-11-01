package com.eduflash.controller;

import com.eduflash.dto.FolderCreateRequest;
import com.eduflash.dto.FolderDto;
import com.eduflash.entity.User;
import com.eduflash.repository.UserRepository;
import com.eduflash.service.FolderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/folders")
@RequiredArgsConstructor
public class FolderController {

    private final FolderService folderService;
    private final UserRepository userRepository;

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping
    public ResponseEntity<Page<FolderDto>> getFolders(@PageableDefault(size = 20) Pageable pageable) {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(folderService.getAllFoldersByUser(user, pageable));
    }

    @PostMapping
    public ResponseEntity<FolderDto> createFolder(@RequestBody FolderCreateRequest request) {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(folderService.createFolder(request, user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FolderDto> updateFolder(
            @PathVariable Long id,
            @RequestBody FolderCreateRequest request) {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(folderService.updateFolder(id, request, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFolder(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        folderService.deleteFolder(id, user);
        return ResponseEntity.noContent().build();
    }
}

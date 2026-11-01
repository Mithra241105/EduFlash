package com.eduflash.controller;

import com.eduflash.dto.DocumentDto;
import com.eduflash.entity.User;
import com.eduflash.service.ShareService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/share")
public class ShareController {

    private final ShareService shareService;

    public ShareController(ShareService shareService) {
        this.shareService = shareService;
    }

    @PostMapping("/documents/{documentId}")
    public ResponseEntity<String> generateShareLink(
            @PathVariable Long documentId,
            @AuthenticationPrincipal User user) {
        try {
            String token = shareService.generateShareLink(documentId, user);
            return ResponseEntity.ok(token);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{token}")
    public ResponseEntity<?> resolveToken(@PathVariable String token) {
        try {
            DocumentDto documentDto = shareService.resolveShareLink(token);
            return ResponseEntity.ok(documentDto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

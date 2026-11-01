package com.eduflash.controller;

import com.eduflash.entity.AiJob;
import com.eduflash.entity.User;
import com.eduflash.repository.AiJobRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/jobs")
@Transactional
public class JobController {

    private final AiJobRepository aiJobRepository;

    public JobController(AiJobRepository aiJobRepository) {
        this.aiJobRepository = aiJobRepository;
    }

    @GetMapping("/{jobId}")
    public ResponseEntity<?> getJobStatus(@PathVariable Long jobId, @AuthenticationPrincipal User user) {
        try {
            AiJob job = aiJobRepository.findById(jobId).orElse(null);
            if (job == null) {
                return ResponseEntity.notFound().build();
            }
            if (!job.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(403).body("Unauthorized to view this job");
            }
            return ResponseEntity.ok(job);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error: " + e.getMessage() + " - " + e.getClass().getName());
        }
    }
}

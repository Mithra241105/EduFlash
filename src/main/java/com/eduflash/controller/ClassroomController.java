package com.eduflash.controller;

import com.eduflash.entity.Classroom;
import com.eduflash.entity.User;
import com.eduflash.service.ClassroomService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/classrooms")
public class ClassroomController {
    private final ClassroomService classroomService;

    public ClassroomController(ClassroomService classroomService) {
        this.classroomService = classroomService;
    }

    @PostMapping
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Classroom> createClassroom(
            @RequestParam String name,
            @RequestParam(required = false) String description,
            @AuthenticationPrincipal User teacher) {
        Classroom classroom = classroomService.createClassroom(name, description, teacher);
        return ResponseEntity.ok(classroom);
    }

    @PostMapping("/join/{sectionCode}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> joinClassroom(
            @PathVariable String sectionCode,
            @AuthenticationPrincipal User student) {
        try {
            classroomService.joinClassroom(sectionCode, student);
            return ResponseEntity.ok("Successfully joined classroom.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/my-classes")
    public ResponseEntity<List<Classroom>> getMyClasses(@AuthenticationPrincipal User user) {
        List<Classroom> classes = classroomService.getMyClasses(user);
        return ResponseEntity.ok(classes);
    }

    @PostMapping("/{classroomId}/folders/{folderId}/share")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> shareFolderToClassroom(
            @PathVariable Long classroomId,
            @PathVariable Long folderId,
            @AuthenticationPrincipal User teacher) {
        try {
            classroomService.shareFolderToClassroom(classroomId, folderId, teacher);
            return ResponseEntity.ok("Folder shared to classroom successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

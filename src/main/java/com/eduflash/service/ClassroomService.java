package com.eduflash.service;

import com.eduflash.entity.Classroom;
import com.eduflash.entity.ClassroomMembership;
import com.eduflash.entity.User;
import com.eduflash.repository.ClassroomMembershipRepository;
import com.eduflash.repository.ClassroomRepository;
import com.eduflash.repository.FolderRepository;
import com.eduflash.entity.Folder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ClassroomService {
    private final ClassroomRepository classroomRepository;
    private final ClassroomMembershipRepository classroomMembershipRepository;
    private final FolderRepository folderRepository;

    public ClassroomService(ClassroomRepository classroomRepository, ClassroomMembershipRepository classroomMembershipRepository, FolderRepository folderRepository) {
        this.classroomRepository = classroomRepository;
        this.classroomMembershipRepository = classroomMembershipRepository;
        this.folderRepository = folderRepository;
    }

    @Transactional
    public Classroom createClassroom(String name, String description, User teacher) {
        String sectionCode = generateUniqueSectionCode();
        Classroom classroom = Classroom.builder()
                .name(name)
                .description(description)
                .sectionCode(sectionCode)
                .teacher(teacher)
                .build();
        return classroomRepository.save(classroom);
    }

    @Transactional
    public ClassroomMembership joinClassroom(String sectionCode, User student) {
        Classroom classroom = classroomRepository.findBySectionCode(sectionCode)
                .orElseThrow(() -> new IllegalArgumentException("Classroom not found with code: " + sectionCode));

        if (classroomMembershipRepository.existsByClassroomIdAndStudentId(classroom.getId(), student.getId())) {
            throw new IllegalStateException("Student is already in this classroom");
        }

        ClassroomMembership membership = ClassroomMembership.builder()
                .classroom(classroom)
                .student(student)
                .joinedAt(LocalDateTime.now())
                .build();
        return classroomMembershipRepository.save(membership);
    }

    public List<Classroom> getMyClasses(User user) {
        List<Classroom> classes = new ArrayList<>();
        if ("TEACHER".equals(user.getRole().name())) {
            classes.addAll(classroomRepository.findByTeacher(user));
        } else if ("STUDENT".equals(user.getRole().name())) {
            List<ClassroomMembership> memberships = classroomMembershipRepository.findByStudent(user);
            for (ClassroomMembership membership : memberships) {
                classes.add(membership.getClassroom());
            }
        }
        return classes;
    }

    @Transactional
    public void shareFolderToClassroom(Long classroomId, Long folderId, User teacher) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new IllegalArgumentException("Classroom not found"));
        
        if (!classroom.getTeacher().getId().equals(teacher.getId())) {
            throw new IllegalStateException("Only the teacher of this classroom can share folders to it");
        }
        
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found"));

        if (!folder.getUser().getId().equals(teacher.getId())) {
            throw new IllegalStateException("You can only share folders that you own");
        }

        folder.setClassroom(classroom);
        folderRepository.save(folder);
    }


    private String generateUniqueSectionCode() {
        return UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }
}

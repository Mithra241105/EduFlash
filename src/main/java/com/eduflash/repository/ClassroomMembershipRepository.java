package com.eduflash.repository;

import com.eduflash.entity.ClassroomMembership;
import com.eduflash.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClassroomMembershipRepository extends JpaRepository<ClassroomMembership, Long> {
    List<ClassroomMembership> findByStudent(User student);
    boolean existsByClassroomIdAndStudentId(Long classroomId, Long studentId);
}

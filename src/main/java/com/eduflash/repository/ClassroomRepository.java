package com.eduflash.repository;

import com.eduflash.entity.Classroom;
import com.eduflash.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassroomRepository extends JpaRepository<Classroom, Long> {
    Optional<Classroom> findBySectionCode(String sectionCode);
    List<Classroom> findByTeacher(User teacher);
}

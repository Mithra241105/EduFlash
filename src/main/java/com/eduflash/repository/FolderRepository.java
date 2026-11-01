package com.eduflash.repository;

import com.eduflash.entity.Folder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FolderRepository extends JpaRepository<Folder, Long> {
    List<Folder> findByUserId(Long userId);

    @EntityGraph(attributePaths = {"user", "classroom"})
    Page<Folder> findByUserId(Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "classroom"})
    @Query("SELECT DISTINCT f FROM Folder f WHERE f.user.id = :userId OR f.classroom.id IN (SELECT cm.classroom.id FROM ClassroomMembership cm WHERE cm.student.id = :userId)")
    Page<Folder> findOwnedOrClassroomFoldersByUserId(@Param("userId") Long userId, Pageable pageable);
}

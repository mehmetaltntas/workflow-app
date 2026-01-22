package com.workflow.backend.repository;

import com.workflow.backend.entity.Board;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BoardRepository extends JpaRepository<Board, Long> {
    // Özel sorgu: Bir kullanıcı ID'sine ait tüm panoları getir
    List<Board> findByUserId(Long userId);

    boolean existsByNameAndUser(String name, com.workflow.backend.entity.User user);

    // YENİ: Slug ile arama
    java.util.Optional<Board> findBySlug(String slug);

    boolean existsBySlug(String slug);

    // Authorization: Board'un belirli bir kullanıcıya ait olup olmadığını kontrol et
    boolean existsByIdAndUserId(Long boardId, Long userId);
}
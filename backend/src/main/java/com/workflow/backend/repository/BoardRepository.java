package com.workflow.backend.repository;

import com.workflow.backend.entity.Board;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface BoardRepository extends JpaRepository<Board, Long> {
    // Özel sorgu: Bir kullanıcı ID'sine ait tüm panoları getir
    List<Board> findByUserId(Long userId);

    // Pagination destekli sorgu - sadece board bilgileri (liste sayfası için)
    @EntityGraph(attributePaths = {"user"})
    Page<Board> findByUserId(Long userId, Pageable pageable);

    boolean existsByNameAndUser(String name, com.workflow.backend.entity.User user);

    // Basit slug ile arama (authorization kontrolü için)
    Optional<Board> findBySlug(String slug);

    // N+1 Optimizasyonu: Board + User eager fetch (diğerleri @BatchSize ile yüklenir)
    @Query("SELECT b FROM Board b " +
           "LEFT JOIN FETCH b.user " +
           "WHERE b.slug = :slug")
    Optional<Board> findBySlugWithUser(@Param("slug") String slug);

    boolean existsBySlug(String slug);

    // Authorization: Board'un belirli bir kullanıcıya ait olup olmadığını kontrol et
    boolean existsByIdAndUserId(Long boardId, Long userId);
}
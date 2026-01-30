package com.workflow.backend.repository;

import com.workflow.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

// JpaRepository<EntityTürü, IDTürü>
public interface UserRepository extends JpaRepository<User, Long> {
    // Özel sorgu: Username ile kullanıcı bul (Login için lazım olacak)
    User findByUsername(String username);

    // Özel sorgu: Email ile kullanıcı bul (Kayıt için lazım)
    User findByEmail(String email);

    // Case-insensitive email lookup (Şifre sıfırlama için)
    @Query("SELECT u FROM User u WHERE LOWER(u.email) = LOWER(:email)")
    User findByEmailIgnoreCase(@Param("email") String email);

    // Case-insensitive username lookup (Şifre sıfırlama için)
    @Query("SELECT u FROM User u WHERE LOWER(u.username) = LOWER(:username)")
    User findByUsernameIgnoreCase(@Param("username") String username);

    // Google OAuth: Google ID ile kullanıcı bul
    Optional<User> findByGoogleId(String googleId);

    // Kullanici arama: username LIKE sorgusu (kendisi haric, Pageable ile sinirli)
    @Query("SELECT u FROM User u WHERE LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) AND u.id <> :currentUserId ORDER BY u.username ASC")
    List<User> searchByUsername(@Param("query") String query, @Param("currentUserId") Long currentUserId, Pageable pageable);

    // Silme zamani gelmis kullanicilari bul (deletionScheduledAt cutoff'tan once olanlar)
    @Query("SELECT u FROM User u WHERE u.deletionScheduledAt IS NOT NULL AND u.deletionScheduledAt <= :cutoff")
    List<User> findUsersScheduledForDeletion(@Param("cutoff") LocalDateTime cutoff);
}
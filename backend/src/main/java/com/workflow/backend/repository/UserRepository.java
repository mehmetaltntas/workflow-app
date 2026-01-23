package com.workflow.backend.repository;

import com.workflow.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// JpaRepository<EntityTürü, IDTürü>
public interface UserRepository extends JpaRepository<User, Long> {
    // Özel sorgu: Username ile kullanıcı bul (Login için lazım olacak)
    User findByUsername(String username);

    // Özel sorgu: Email ile kullanıcı bul (Kayıt için lazım)
    User findByEmail(String email);

    // Google OAuth: Google ID ile kullanıcı bul
    Optional<User> findByGoogleId(String googleId);
}
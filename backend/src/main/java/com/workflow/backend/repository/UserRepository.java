package com.workflow.backend.repository;

import com.workflow.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

// JpaRepository<EntityTürü, IDTürü>
public interface UserRepository extends JpaRepository<User, Long> {
    // Özel sorgu: Username ile kullanıcı bul (Login için lazım olacak)
    User findByUsername(String username);
}
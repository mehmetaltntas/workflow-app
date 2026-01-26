package com.workflow.backend.service;

import com.workflow.backend.entity.User;
import com.workflow.backend.exception.InvalidCredentialsException;
import com.workflow.backend.exception.ResourceNotFoundException;
import com.workflow.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * SecurityContextHolder'dan mevcut kullanıcıyı alan utility service.
 * JWT authentication sonrası kullanıcı bilgilerine erişim sağlar.
 */
@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final UserRepository userRepository;

    /**
     * Mevcut oturum açmış kullanıcının entity'sini döndürür.
     * @return User entity
     * @throws ResourceNotFoundException eğer kullanıcı bulunamazsa
     */
    public User getCurrentUser() {
        String username = getCurrentUsername();
        User user = userRepository.findByUsername(username);
        if (user == null) {
            throw new ResourceNotFoundException("Kullanıcı", "username", username);
        }
        return user;
    }

    /**
     * Mevcut oturum açmış kullanıcının ID'sini döndürür.
     * JWT'deki userId claim'inden okunur, DB sorgusu yapılmaz.
     * @return User ID
     */
    public Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new InvalidCredentialsException("Oturum açmış kullanıcı bulunamadı!");
        }
        Object credentials = authentication.getCredentials();
        if (credentials instanceof Long) {
            return (Long) credentials;
        }
        // Fallback: JWT'de userId yoksa DB'den al (eski token'lar için)
        return getCurrentUser().getId();
    }

    /**
     * Mevcut oturum açmış kullanıcının username'ini döndürür.
     * @return username
     * @throws InvalidCredentialsException eğer authentication yoksa
     */
    public String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new InvalidCredentialsException("Oturum açmış kullanıcı bulunamadı!");
        }
        return authentication.getName();
    }
}

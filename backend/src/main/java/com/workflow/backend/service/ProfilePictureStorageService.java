package com.workflow.backend.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.UUID;

/**
 * Profil resimlerini dosya sisteminde saklar.
 * Base64 data URL formatindaki veriyi decode ederek diske yazar,
 * dosya yolunu dondurur.
 */
@Slf4j
@Service
public class ProfilePictureStorageService {

    @Value("${profile-picture.storage-dir:./uploads/profile-pictures}")
    private String storageDir;

    private Path storagePath;

    @PostConstruct
    public void init() {
        storagePath = Paths.get(storageDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(storagePath);
            log.info("Profil resmi dizini hazirlandi: {}", storagePath);
        } catch (IOException e) {
            log.error("Profil resmi dizini olusturulamadi: {}", storagePath, e);
            throw new RuntimeException("Profil resmi dizini olusturulamadi", e);
        }
    }

    /**
     * Base64 data URL formatindaki profil resmini diske kaydeder.
     * Ornek data URL: "data:image/png;base64,iVBORw0KGgo..."
     *
     * @param userId kullanici ID
     * @param base64Data Base64 data URL veya salt Base64 verisi
     * @return kaydedilen dosyanin yolu
     */
    public String save(Long userId, String base64Data) {
        try {
            String extension = "png"; // varsayilan
            String rawBase64 = base64Data;

            // Data URL formatindaysa parse et
            if (base64Data.startsWith("data:")) {
                // "data:image/png;base64,iVBORw0KGgo..."
                String[] parts = base64Data.split(",", 2);
                if (parts.length == 2) {
                    rawBase64 = parts[1];
                    // MIME type'dan uzanti cikar
                    String header = parts[0]; // "data:image/png;base64"
                    if (header.contains("image/jpeg") || header.contains("image/jpg")) {
                        extension = "jpg";
                    } else if (header.contains("image/gif")) {
                        extension = "gif";
                    } else if (header.contains("image/webp")) {
                        extension = "webp";
                    }
                    // png varsayilan olarak kalir
                }
            }

            byte[] imageBytes = Base64.getDecoder().decode(rawBase64);

            // Dosya adi: userId_uuid.ext (benzersiz, cakisma olmaz)
            String fileName = userId + "_" + UUID.randomUUID() + "." + extension;
            Path filePath = storagePath.resolve(fileName);

            Files.write(filePath, imageBytes);
            log.info("Profil resmi kaydedildi: userId={}, dosya={}", userId, fileName);

            return filePath.toString();
        } catch (IOException e) {
            log.error("Profil resmi kaydedilemedi: userId={}", userId, e);
            throw new RuntimeException("Profil resmi kaydedilemedi", e);
        } catch (IllegalArgumentException e) {
            log.error("Gecersiz Base64 verisi: userId={}", userId, e);
            throw new RuntimeException("Gecersiz profil resmi verisi", e);
        }
    }

    /**
     * Dosya sisteminden profil resmini okur.
     *
     * @param filePath dosya yolu
     * @return dosya icerigi (byte[])
     */
    public byte[] load(String filePath) {
        try {
            Path path = Paths.get(filePath).toAbsolutePath().normalize();

            // Guvenlik kontrolu: dosya storage dizini icinde olmali
            if (!path.startsWith(storagePath)) {
                throw new SecurityException("Dosya yolu gecersiz: storage dizini disinda");
            }

            return Files.readAllBytes(path);
        } catch (IOException e) {
            log.error("Profil resmi okunamadi: {}", filePath, e);
            throw new RuntimeException("Profil resmi okunamadi", e);
        }
    }

    /**
     * Dosya uzantisindan MIME type belirler.
     *
     * @param filePath dosya yolu
     * @return MIME type (ornegin "image/png")
     */
    public String getContentType(String filePath) {
        String lower = filePath.toLowerCase();
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (lower.endsWith(".gif")) {
            return "image/gif";
        } else if (lower.endsWith(".webp")) {
            return "image/webp";
        }
        return "image/png"; // varsayilan
    }

    /**
     * Dosya sisteminden profil resmini siler.
     *
     * @param filePath dosya yolu
     */
    public void delete(String filePath) {
        try {
            Path path = Paths.get(filePath).toAbsolutePath().normalize();

            // Guvenlik kontrolu: dosya storage dizini icinde olmali
            if (!path.startsWith(storagePath)) {
                throw new SecurityException("Dosya yolu gecersiz: storage dizini disinda");
            }

            if (Files.deleteIfExists(path)) {
                log.info("Profil resmi silindi: {}", filePath);
            } else {
                log.warn("Silinecek profil resmi bulunamadi: {}", filePath);
            }
        } catch (IOException e) {
            log.error("Profil resmi silinemedi: {}", filePath, e);
            // Silme hatasi kritik degil, loglayip devam et
        }
    }
}

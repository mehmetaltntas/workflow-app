package com.workflow.backend.exception;

/**
 * Sistem yapılandırma hataları için fırlatılır (HTTP 500).
 * Eksik veya hatalı konfigürasyon durumlarında kullanılır.
 */
public class ConfigurationException extends RuntimeException {

    public ConfigurationException(String message) {
        super(message);
    }

    public ConfigurationException(String message, Throwable cause) {
        super(message, cause);
    }
}

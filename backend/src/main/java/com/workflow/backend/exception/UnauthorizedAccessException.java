package com.workflow.backend.exception;

/**
 * Kullanıcının yetkisi olmayan bir kaynağa erişmeye çalıştığında fırlatılır.
 * HTTP 403 Forbidden response döndürür.
 */
public class UnauthorizedAccessException extends RuntimeException {

    public UnauthorizedAccessException(String message) {
        super(message);
    }

    public UnauthorizedAccessException(String resourceType, Long resourceId) {
        super(String.format("Bu %s kaynağına erişim yetkiniz yok: %d", resourceType, resourceId));
    }
}

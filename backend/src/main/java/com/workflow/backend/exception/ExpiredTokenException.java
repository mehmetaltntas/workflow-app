package com.workflow.backend.exception;

/**
 * Token süresi dolduğunda fırlatılır (HTTP 401).
 * Refresh token veya doğrulama kodu süresi dolduğunda kullanılır.
 */
public class ExpiredTokenException extends RuntimeException {

    public ExpiredTokenException(String message) {
        super(message);
    }

    public ExpiredTokenException() {
        super("Token süresi dolmuş. Lütfen tekrar giriş yapın.");
    }
}

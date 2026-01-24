package com.workflow.backend.exception;

/**
 * Kimlik doğrulama hataları için fırlatılır (HTTP 401).
 * Kullanıcı adı/şifre hatalı veya geçersiz kimlik bilgileri durumlarında kullanılır.
 */
public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException(String message) {
        super(message);
    }

    public InvalidCredentialsException() {
        super("Kullanıcı adı veya şifre hatalı!");
    }
}

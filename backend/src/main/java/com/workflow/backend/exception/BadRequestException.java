package com.workflow.backend.exception;

/**
 * Geçersiz istek durumunda fırlatılır (HTTP 400).
 */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }

    public BadRequestException(String message, Throwable cause) {
        super(message, cause);
    }
}

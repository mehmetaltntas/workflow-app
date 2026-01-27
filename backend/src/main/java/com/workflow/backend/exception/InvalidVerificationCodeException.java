package com.workflow.backend.exception;

public class InvalidVerificationCodeException extends RuntimeException {

    public InvalidVerificationCodeException(String message) {
        super(message);
    }

    public InvalidVerificationCodeException() {
        super("Geçersiz veya süresi dolmuş doğrulama kodu");
    }
}

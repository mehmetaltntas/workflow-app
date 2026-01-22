package com.workflow.backend.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Tüm API hatalarını yakalayan ve formatlanmış response döndüren global exception handler.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Bean Validation hatalarını yakala (DTO validation)
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        String message = errors.values().stream()
                .collect(Collectors.joining(", "));

        logger.warn("Validation hatası: {}", message);

        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Doğrulama Hatası",
                message,
                errors
        );

        return ResponseEntity.badRequest().body(errorResponse);
    }

    /**
     * Genel RuntimeException'ları yakala (Kullanıcı bulunamadı, şifre hatalı vb.)
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntimeException(RuntimeException ex) {
        logger.error("Runtime hatası: {}", ex.getMessage());

        HttpStatus status = HttpStatus.BAD_REQUEST;
        String errorType = "İşlem Hatası";

        // Daha spesifik hata mesajları için
        if (ex.getMessage() != null) {
            if (ex.getMessage().contains("bulunamadı")) {
                status = HttpStatus.NOT_FOUND;
                errorType = "Kayıt Bulunamadı";
            } else if (ex.getMessage().contains("hatalı") || ex.getMessage().contains("yanlış")) {
                status = HttpStatus.UNAUTHORIZED;
                errorType = "Kimlik Doğrulama Hatası";
            } else if (ex.getMessage().contains("zaten")) {
                status = HttpStatus.CONFLICT;
                errorType = "Çakışma Hatası";
            }
        }

        ErrorResponse errorResponse = new ErrorResponse(
                status.value(),
                errorType,
                ex.getMessage(),
                null
        );

        return ResponseEntity.status(status).body(errorResponse);
    }

    /**
     * IllegalStateException'ları yakala (JWT secret key hatası vb.)
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalStateException(IllegalStateException ex) {
        logger.error("Yapılandırma hatası: {}", ex.getMessage());

        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Yapılandırma Hatası",
                "Sunucu yapılandırmasında bir sorun var. Lütfen yönetici ile iletişime geçin.",
                null
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }

    /**
     * Tüm diğer Exception'ları yakala
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleAllExceptions(Exception ex) {
        logger.error("Beklenmeyen hata: ", ex);

        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Sunucu Hatası",
                "Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
                null
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }

    /**
     * Standart hata response yapısı
     */
    public static class ErrorResponse {
        private int status;
        private String error;
        private String message;
        private LocalDateTime timestamp;
        private Map<String, String> details;

        public ErrorResponse(int status, String error, String message, Map<String, String> details) {
            this.status = status;
            this.error = error;
            this.message = message;
            this.timestamp = LocalDateTime.now();
            this.details = details;
        }

        // Getters
        public int getStatus() { return status; }
        public String getError() { return error; }
        public String getMessage() { return message; }
        public LocalDateTime getTimestamp() { return timestamp; }
        public Map<String, String> getDetails() { return details; }
    }
}

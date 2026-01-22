package com.workflow.backend.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.regex.Pattern;

/**
 * Şifre güvenlik kurallarını kontrol eden validator.
 */
public class PasswordValidator implements ConstraintValidator<ValidPassword, String> {

    // En az 8 karakter
    private static final int MIN_LENGTH = 8;

    // Regex pattern'ları
    private static final Pattern UPPERCASE_PATTERN = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE_PATTERN = Pattern.compile("[a-z]");
    private static final Pattern DIGIT_PATTERN = Pattern.compile("[0-9]");
    private static final Pattern SPECIAL_CHAR_PATTERN = Pattern.compile("[!@#$%^&*(),.?\":{}|<>\\-_=+\\[\\]\\\\;'/`~]");

    @Override
    public void initialize(ValidPassword constraintAnnotation) {
        // Özel bir initialization gerekli değil
    }

    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        if (password == null || password.isEmpty()) {
            return false;
        }

        StringBuilder errors = new StringBuilder();
        boolean isValid = true;

        // Minimum uzunluk kontrolü
        if (password.length() < MIN_LENGTH) {
            errors.append("En az ").append(MIN_LENGTH).append(" karakter olmalı. ");
            isValid = false;
        }

        // Büyük harf kontrolü
        if (!UPPERCASE_PATTERN.matcher(password).find()) {
            errors.append("En az 1 büyük harf içermeli. ");
            isValid = false;
        }

        // Küçük harf kontrolü
        if (!LOWERCASE_PATTERN.matcher(password).find()) {
            errors.append("En az 1 küçük harf içermeli. ");
            isValid = false;
        }

        // Rakam kontrolü
        if (!DIGIT_PATTERN.matcher(password).find()) {
            errors.append("En az 1 rakam içermeli. ");
            isValid = false;
        }

        // Özel karakter kontrolü
        if (!SPECIAL_CHAR_PATTERN.matcher(password).find()) {
            errors.append("En az 1 özel karakter içermeli (!@#$%^&* vb.). ");
            isValid = false;
        }

        // Custom hata mesajı oluştur
        if (!isValid) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(errors.toString().trim())
                   .addConstraintViolation();
        }

        return isValid;
    }
}

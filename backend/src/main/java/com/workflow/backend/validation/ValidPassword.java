package com.workflow.backend.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

/**
 * Şifre güvenlik kurallarını kontrol eden custom annotation.
 * Kurallar:
 * - En az 8 karakter
 * - En az 1 büyük harf
 * - En az 1 küçük harf
 * - En az 1 rakam
 * - En az 1 özel karakter (!@#$%^&*(),.?":{}|<>)
 */
@Documented
@Constraint(validatedBy = PasswordValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidPassword {
    String message() default "Şifre en az 8 karakter, 1 büyük harf, 1 küçük harf, 1 rakam ve 1 özel karakter içermelidir";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

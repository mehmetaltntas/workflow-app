package com.workflow.backend.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Async
    public void sendPasswordResetCode(String toEmail, String code) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("WorkFlow - Sifre Sifirlama Kodu");
            message.setText(buildPasswordResetEmailBody(code));

            mailSender.send(message);
            logger.info("Sifre sifirlama kodu {} adresine gonderildi", toEmail);
        } catch (Exception e) {
            logger.error("Email gonderme hatasi: {} - {}", toEmail, e.getMessage());
            throw new RuntimeException("Email gonderilemedi. Lutfen daha sonra tekrar deneyin.");
        }
    }

    @Async
    public void sendRegistrationVerificationCode(String toEmail, String code) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("WorkFlow - Kayit Dogrulama Kodu");
            message.setText(buildRegistrationVerificationEmailBody(code));

            mailSender.send(message);
            logger.info("Kayit dogrulama kodu {} adresine gonderildi", toEmail);
        } catch (Exception e) {
            logger.error("Email gonderme hatasi: {} - {}", toEmail, e.getMessage());
            throw new RuntimeException("Email gonderilemedi. Lutfen daha sonra tekrar deneyin.");
        }
    }

    private String buildRegistrationVerificationEmailBody(String code) {
        return String.format("""
            Merhaba,

            WorkFlow'a kayit oldugunuz icin tesekkurler!

            Dogrulama kodunuz: %s

            Bu kod 15 dakika icinde gecerliligini yitirecektir.

            Eger bu talebi siz yapmadiyseniz, bu emaili gormezden gelebilirsiniz.

            Saygilarimizla,
            WorkFlow Ekibi
            """, code);
    }

    private String buildPasswordResetEmailBody(String code) {
        return String.format("""
            Merhaba,

            WorkFlow hesabiniz icin sifre sifirlama talebinde bulundunuz.

            Dogrulama kodunuz: %s

            Bu kod 15 dakika icinde gecerliliğini yitirecektir.

            Eger bu talebi siz yapmadiyseniz, bu emaili gormezden gelebilirsiniz.

            Saygilarimizla,
            WorkFlow Ekibi
            """, code);
    }
}

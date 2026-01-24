package com.workflow.backend.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("WorkFlow API")
                        .description("Kanban tarzı iş takip uygulaması REST API dokümantasyonu")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("WorkFlow Team")
                                .email("support@workflow.com")))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName, new SecurityScheme()
                                .name(securitySchemeName)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("JWT Bearer token. Login endpoint'inden alınır.")))
                .tags(List.of(
                        new Tag().name("Auth").description("Kimlik doğrulama işlemleri (kayıt, giriş, şifre sıfırlama)"),
                        new Tag().name("Boards").description("Pano (board) işlemleri"),
                        new Tag().name("Tasks").description("Görev (task) ve liste (task list) işlemleri"),
                        new Tag().name("Labels").description("Etiket işlemleri"),
                        new Tag().name("Users").description("Kullanıcı profil işlemleri"),
                        new Tag().name("Subtasks").description("Alt görev işlemleri")
                ));
    }
}

package com.workflow.backend.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        private final JwtFilter jwtFilter;

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                .csrf(AbstractHttpConfigurer::disable) // CSRF kapalı
                                .cors(cors -> cors.configurationSource(corsConfigurationSource())) // CORS Açık
                                .headers(headers -> headers
                                                .frameOptions(frame -> frame.disable()) // H2 Konsol vb. için
                                                // DÜZELTME BURADA: disable() yerine izin veren politika yazıyoruz
                                                .contentSecurityPolicy(csp -> csp
                                                                .policyDirectives("default-src 'self'; " +
                                                                                "connect-src 'self' http://localhost:8080 http://localhost:5173 http://localhost:5174; "
                                                                                +
                                                                                "script-src 'self' 'unsafe-eval' 'unsafe-inline' http://localhost:5173; "
                                                                                +
                                                                                "style-src 'self' 'unsafe-inline'; " +
                                                                                "img-src 'self' data:; " +
                                                                                "font-src 'self' data:;")))
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers("/auth/**").permitAll() // Login/Register herkese açık
                                                .anyRequest().authenticated() // Diğer her şey token ister
                                )
                                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        @Bean
        public UrlBasedCorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();
                // Frontend'in çalıştığı portlara izin ver
                configuration.setAllowedOrigins(
                                Arrays.asList("http://localhost:3000", "http://localhost:5173",
                                                "http://localhost:5174"));
                configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                configuration.setAllowedHeaders(List.of("*"));
                configuration.setAllowCredentials(true);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }
}
package com.workflow.backend.security;

import com.workflow.backend.config.CorsProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
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
        private final RateLimitFilter rateLimitFilter;
        private final CorsProperties corsProperties;
        private final Environment environment;

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                .csrf(AbstractHttpConfigurer::disable)
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .headers(headers -> headers
                                                .frameOptions(frame -> frame.deny())
                                                .contentSecurityPolicy(csp -> csp
                                                                .policyDirectives("default-src 'self'; " +
                                                                                "connect-src 'self' " + getAllowedOriginsForCSP() + " https://accounts.google.com https://oauth2.googleapis.com; " +
                                                                                "script-src 'self' https://accounts.google.com https://apis.google.com; " +
                                                                                "style-src 'self' 'unsafe-inline' https://accounts.google.com; " +
                                                                                "img-src 'self' data: https://*.googleusercontent.com; " +
                                                                                "frame-src https://accounts.google.com; " +
                                                                                "font-src 'self' data:;"))
                                                .xssProtection(xss -> xss.disable())
                                                .contentTypeOptions(contentType -> {}))
                                .authorizeHttpRequests(auth -> {
                                        auth.requestMatchers("/auth/**", "/error").permitAll();
                                        if (isDevProfile()) {
                                                auth.requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**", "/swagger-resources/**").permitAll();
                                        }
                                        auth.anyRequest().authenticated();
                                })
                                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        @Bean
        public UrlBasedCorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();

                // Environment variable'dan origin'leri oku
                List<String> origins = Arrays.asList(corsProperties.getAllowedOriginsArray());
                configuration.setAllowedOrigins(origins);

                configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
                configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With", "Accept"));
                configuration.setExposedHeaders(List.of("Authorization"));
                configuration.setAllowCredentials(true);
                configuration.setMaxAge(3600L); // 1 saat preflight cache

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder(12); // Güvenlik için strength artırıldı
        }

        private boolean isDevProfile() {
                return Arrays.asList(environment.getActiveProfiles()).contains("dev");
        }

        private String getAllowedOriginsForCSP() {
                return String.join(" ", corsProperties.getAllowedOriginsArray());
        }
}

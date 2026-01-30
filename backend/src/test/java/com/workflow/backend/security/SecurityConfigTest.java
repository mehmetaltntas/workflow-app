package com.workflow.backend.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Import(SecurityConfigTest.JacksonTestConfig.class)
@TestPropertySource(properties = {
        "cors.allowed-origins=http://localhost:3000,http://localhost:5173",
        "google.client-id=",
        "profile-picture.storage-dir=${java.io.tmpdir}/security-test-uploads"
})
@DisplayName("SecurityConfig Integration Tests")
class SecurityConfigTest {

    @TestConfiguration
    static class JacksonTestConfig {
        @Bean
        ObjectMapper objectMapper() {
            return new ObjectMapper();
        }
    }

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    @Nested
    @DisplayName("Public Endpoints - Accessible Without Authentication")
    class PublicEndpointTests {

        @Test
        @DisplayName("POST /auth/login should not be blocked by security filter")
        void login_shouldBeAccessibleWithoutAuth() throws Exception {
            MvcResult result = mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"username\":\"testuser\",\"password\":\"TestPassword123!\"}"))
                    .andReturn();

            // The request should reach the controller (not blocked by security).
            // Business logic may return 401 for invalid credentials, which is fine.
            // Verify the response does NOT contain the security filter's specific message.
            String body = result.getResponse().getContentAsString();
            assertThat(body).doesNotContain("Oturum süresi dolmuş");
        }

        @Test
        @DisplayName("POST /auth/register should not return 401")
        void register_shouldBeAccessibleWithoutAuth() throws Exception {
            MvcResult result = mockMvc.perform(post("/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"username\":\"newuser\",\"email\":\"new@example.com\","
                                    + "\"password\":\"TestPassword123!\","
                                    + "\"verificationCode\":\"123456\"}"))
                    .andReturn();

            assertThat(result.getResponse().getStatus()).isNotEqualTo(401);
        }

        @Test
        @DisplayName("POST /auth/refresh should not be blocked by security filter")
        void refresh_shouldBeAccessibleWithoutAuth() throws Exception {
            MvcResult result = mockMvc.perform(post("/auth/refresh")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andReturn();

            // The request should reach the controller (not blocked by security).
            // Business logic may return 401 when no refresh token cookie is present.
            String body = result.getResponse().getContentAsString();
            assertThat(body).doesNotContain("Oturum süresi dolmuş");
        }

        @Test
        @DisplayName("GET /users/1/profile-picture should not return 401")
        void profilePicture_shouldBeAccessibleWithoutAuth() throws Exception {
            MvcResult result = mockMvc.perform(get("/users/1/profile-picture"))
                    .andReturn();

            assertThat(result.getResponse().getStatus()).isNotEqualTo(401);
        }

        @Test
        @DisplayName("GET /auth/check-username should not return 401")
        void checkUsername_shouldBeAccessibleWithoutAuth() throws Exception {
            MvcResult result = mockMvc.perform(get("/auth/check-username")
                            .param("username", "testuser"))
                    .andReturn();

            assertThat(result.getResponse().getStatus()).isNotEqualTo(401);
        }
    }

    @Nested
    @DisplayName("Protected Endpoints - Require Authentication")
    class ProtectedEndpointTests {

        @Test
        @DisplayName("GET /boards/user/1 should return 401 without token")
        void getUserBoards_shouldReturn401WithoutAuth() throws Exception {
            mockMvc.perform(get("/boards/user/1"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("GET /users/1 should return 401 without token")
        void getUser_shouldReturn401WithoutAuth() throws Exception {
            mockMvc.perform(get("/users/1"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("POST /boards should return 401 without token")
        void createBoard_shouldReturn401WithoutAuth() throws Exception {
            mockMvc.perform(post("/boards")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"name\":\"Test Board\",\"status\":\"PLANLANDI\"}"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("DELETE /boards/1 should return 401 without token")
        void deleteBoard_shouldReturn401WithoutAuth() throws Exception {
            mockMvc.perform(delete("/boards/1"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("401 response should contain JSON error body")
        void protectedEndpoint_shouldReturnJsonErrorBody() throws Exception {
            mockMvc.perform(get("/boards/user/1"))
                    .andExpect(status().isUnauthorized())
                    .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.status").value(401))
                    .andExpect(jsonPath("$.error").value("Unauthorized"));
        }
    }

    @Nested
    @DisplayName("Security Headers")
    class SecurityHeaderTests {

        @Test
        @DisplayName("Response should contain X-Content-Type-Options: nosniff")
        void shouldContainContentTypeOptionsHeader() throws Exception {
            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"username\":\"testuser\",\"password\":\"TestPassword123!\"}"))
                    .andExpect(header().string("X-Content-Type-Options", "nosniff"));
        }

        @Test
        @DisplayName("Response should contain X-Frame-Options: DENY")
        void shouldContainFrameOptionsDeny() throws Exception {
            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"username\":\"testuser\",\"password\":\"TestPassword123!\"}"))
                    .andExpect(header().string("X-Frame-Options", "DENY"));
        }

        @Test
        @DisplayName("Response should contain Content-Security-Policy header")
        void shouldContainContentSecurityPolicyHeader() throws Exception {
            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"username\":\"testuser\",\"password\":\"TestPassword123!\"}"))
                    .andExpect(header().exists("Content-Security-Policy"));
        }
    }

    @Nested
    @DisplayName("CORS Configuration")
    class CorsTests {

        @Test
        @DisplayName("OPTIONS preflight should include CORS headers for allowed origin")
        void optionsPreflight_shouldIncludeCorsHeaders() throws Exception {
            mockMvc.perform(options("/auth/login")
                            .header("Origin", "http://localhost:3000")
                            .header("Access-Control-Request-Method", "POST")
                            .header("Access-Control-Request-Headers", "Content-Type"))
                    .andExpect(header().exists("Access-Control-Allow-Origin"))
                    .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"));
        }

        @Test
        @DisplayName("CORS should allow credentials")
        void optionsPreflight_shouldAllowCredentials() throws Exception {
            mockMvc.perform(options("/auth/login")
                            .header("Origin", "http://localhost:3000")
                            .header("Access-Control-Request-Method", "POST")
                            .header("Access-Control-Request-Headers", "Content-Type"))
                    .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
        }

        @Test
        @DisplayName("CORS should reject disallowed origins")
        void cors_shouldRejectDisallowedOrigin() throws Exception {
            MvcResult result = mockMvc.perform(options("/auth/login")
                            .header("Origin", "http://malicious-site.com")
                            .header("Access-Control-Request-Method", "POST")
                            .header("Access-Control-Request-Headers", "Content-Type"))
                    .andReturn();

            String allowOrigin = result.getResponse().getHeader("Access-Control-Allow-Origin");
            assertThat(allowOrigin).isNotEqualTo("http://malicious-site.com");
        }
    }

    @Nested
    @DisplayName("Session Management - Stateless")
    class SessionManagementTests {

        @Test
        @DisplayName("Response should not contain JSESSIONID cookie")
        void response_shouldNotContainSessionCookie() throws Exception {
            MvcResult result = mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"username\":\"testuser\",\"password\":\"TestPassword123!\"}"))
                    .andReturn();

            jakarta.servlet.http.Cookie[] cookies = result.getResponse().getCookies();
            if (cookies != null) {
                for (jakarta.servlet.http.Cookie cookie : cookies) {
                    assertThat(cookie.getName()).isNotEqualTo("JSESSIONID");
                }
            }
        }
    }
}

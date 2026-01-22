package com.workflow.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "cors")
public class CorsProperties {

    private String allowedOrigins = "http://localhost:3000,http://localhost:5173";

    public String getAllowedOrigins() {
        return allowedOrigins;
    }

    public void setAllowedOrigins(String allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }

    /**
     * Returns allowed origins as an array
     */
    public String[] getAllowedOriginsArray() {
        return allowedOrigins.split(",");
    }
}

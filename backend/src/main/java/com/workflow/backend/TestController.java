package com.workflow.backend;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@Profile("dev")
@RestController
public class TestController {

    @GetMapping("/test")
    public String deneme() {
        return "WorkFlow Backend Çalışıyor! 🚀";
    }
}

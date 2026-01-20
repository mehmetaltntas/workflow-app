package com.workflow.backend;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @GetMapping("/test")
    public String deneme() {
        return "WorkFlow Backend Çalışıyor! 🚀";
    }
}

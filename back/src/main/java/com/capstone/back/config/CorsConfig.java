package com.capstone.back.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;
import org.springframework.lang.NonNull;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:3000")  // 프론트 주소
                .allowedMethods("*")
                .allowedHeaders("*")
                .allowCredentials(true); // ✅ 세션 쿠키 허용
    }
}

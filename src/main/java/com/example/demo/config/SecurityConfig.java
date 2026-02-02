package com.example.demo.config;

import org.springframework.boot.autoconfigure.security.servlet.PathRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth

                // ✅ ALWAYS allow preflight
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // ✅ Allow static resources served by Spring Boot (CSS/JS/images, etc.)
                .requestMatchers(PathRequest.toStaticResources().atCommonLocations()).permitAll()

                // ✅ Allow your HTML pages and root
                .requestMatchers(
                    "/", "/index.html",
                    "/*.html",
                    "/*.css",
                    "/*.js",
                    "/img/**",
                    "/uploads/**",
                    "/favicon.ico",
                    "/error"
                ).permitAll()

                // ✅ Your API endpoints (you currently allow all for testing)
                .requestMatchers(
                    "/signup",
                    "/login",
                    "/posts/**",
                    "/users/**",
                    "/comments/**",
                    "/likes/**",
                    "/api/**"
                ).permitAll()

                .anyRequest().authenticated()
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // ✅ Allow local dev + Railway domain
        configuration.setAllowedOriginPatterns(List.of(
            "http://localhost:*",
            "http://127.0.0.1:*",
            "http://10.0.2.2:*",
            "https://*.railway.app"
        ));

        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

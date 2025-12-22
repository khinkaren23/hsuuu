package com.example.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // 開発用のためCSRF保護を無効化（POSTリクエストを通すため）
            .csrf(csrf -> csrf.disable())
            // CORS設定を適用
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                // ▼【重要】静的リソース（HTML, CSS, JS, 画像）を全て許可
                // "/**" は強力すぎるため、具体的な拡張子やフォルダで指定します
                .requestMatchers(
                    "/", 
                    "/index.html", 
                    "/*.html",      // すべてのHTMLファイル
                    "/*.css",       // すべてのCSSファイル
                    "/*.js",        // すべてのJSファイル
                    "/img/**",      // imgフォルダの中身
                    "/uploads/**",  // アップロード画像
                    "/favicon.ico",  // アイコン
                    "/error"        // エラーページ
                ).permitAll()
                
                // ▼ APIエンドポイントもテスト用に許可
                .requestMatchers(
                    "/signup", 
                    "/login", 
                    "/posts/**",    // 投稿関連のAPI全て
                    "/users/**",    // ユーザー関連のAPI全て
                    "/comments/**", // コメント関連
                    "/likes/**",    // いいね関連
                    "/api/**"
                ).permitAll()
                
                // 上記以外は認証が必要
                .anyRequest().authenticated()
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();// ▼【修正】 "http://127.0.0.1:5500" を追加しました
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000", 
            "http://localhost:8080", 
            "http://10.0.2.2:8080",
            "http://127.0.0.1:5500"  // <--- これを追加！
        ));
        
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
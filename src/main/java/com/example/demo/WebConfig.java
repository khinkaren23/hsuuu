package com.example.demo;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // 1. 画像フォルダの公開設定
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // プロジェクトのルートにある "uploads" フォルダの絶対パスを取得
        // (Windows/Mac問わず動作するようにPathクラスを使用)
        String uploadDir = Paths.get("uploads").toAbsolutePath().normalize().toString();
        
        // URL "http://localhost:8080/uploads/..." へのアクセスを
        // ローカルフォルダ "file:///C:/.../demo/uploads/" にマッピングする
        // ※ addResourceLocations のパス末尾には必ず "/" が必要です
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadDir + "/");
    }

    // 2. CORS設定（フロントエンドからのアクセス許可）
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                // パソコンのブラウザ(localhost:8080)と、Androidエミュレータ(10.0.2.2)を許可
                .allowedOrigins("http://localhost:3000", "http://localhost:8080", "http://10.0.2.2:8080")
                // .allowedOrigins("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
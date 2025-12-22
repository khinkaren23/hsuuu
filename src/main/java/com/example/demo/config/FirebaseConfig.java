package com.example.demo.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.ByteArrayInputStream;
import java.util.Base64;

@Configuration
public class FirebaseConfig {

    @Bean
    public FirebaseApp firebaseApp() {
        try {
            String base64 = System.getenv("FIREBASE_SERVICE_ACCOUNT_BASE64");

            if (base64 == null || base64.isEmpty()) {
                throw new IllegalStateException("FIREBASE_SERVICE_ACCOUNT_BASE64 is not set");
            }

            byte[] decoded = Base64.getDecoder().decode(base64);
            ByteArrayInputStream serviceAccount =
                    new ByteArrayInputStream(decoded);

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                return FirebaseApp.initializeApp(options);
            }
            return FirebaseApp.getInstance();

        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize Firebase", e);
        }
    }
}

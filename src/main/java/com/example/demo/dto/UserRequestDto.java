package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank; // (1) インポート
import jakarta.validation.constraints.Size;

public class UserRequestDto {

    @NotBlank(message = "ユーザー名は必須です") // (2) 検証ルール
    private String username;
    
    @NotBlank(message = "パスワードは必須です")
    @Size(min = 8, message = "パスワードは8文字以上である必要があります") // (2) 8文字以上のルール
    private String password;

    // (3) password の Getter / Setter
    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    // --- Getter / Setter ---
    public String getUsername() {
        return username;
    }
    public void setUsername(String username) {
        this.username = username;
    }
}
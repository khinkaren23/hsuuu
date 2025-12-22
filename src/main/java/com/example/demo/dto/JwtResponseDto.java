package com.example.demo.dto;

// (1) トークンを返すためだけのシンプルな箱
public class JwtResponseDto {
    private String token;

    // (2) コンストラクタ (AuthControllerで new JwtResponseDto(jwt) のために使う)
    public JwtResponseDto(String token) {
        this.token = token;
    }

    // (3) Getter (SpringがJSONに変換するために使う)
    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
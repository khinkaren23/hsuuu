package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank; // (1) バリデーションをインポート

public class CommentRequestDto {

    @NotBlank(message = "コメント内容は必須です") // (2) 空のコメントを禁止
    private String content;

    // --- Getter / Setter ---
    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
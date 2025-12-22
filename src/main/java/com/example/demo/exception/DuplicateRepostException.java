package com.example.demo.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

// (1) この例外が投げられたら、HTTP 409 (CONFLICT) を返すよう指示
@ResponseStatus(HttpStatus.CONFLICT)
public class DuplicateRepostException extends RuntimeException {

    // (2) エラーメッセージを受け取るための定型コード
    public DuplicateRepostException(String message) {
        super(message);
    }
}
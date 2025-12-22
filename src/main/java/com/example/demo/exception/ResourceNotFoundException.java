package com.example.demo.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

// (1) この例外が投げられたら、HTTP 404 (NOT_FOUND) を返すよう指示
@ResponseStatus(HttpStatus.NOT_FOUND) 
public class ResourceNotFoundException extends RuntimeException {

    // (2) エラーメッセージを受け取るための定型コード
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
package com.example.demo.controller;

import com.example.demo.user.User;
import com.example.demo.service.UserService;
import com.example.demo.dto.UserRequestDto;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/users")
    public User createUser(@Valid @RequestBody UserRequestDto userDto) {
        return userService.createUser(userDto);
    }

    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/users/{id}")
    public User getUserById(@PathVariable String id) {
        return userService.getUserById(id);
    }

    @DeleteMapping("/users/{id}")
    public void deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
    }

    @PostMapping("/users/{id}/profile-image")
    public User uploadProfileImage(
            @PathVariable String id,
            @RequestParam("image") MultipartFile file) {
        return userService.uploadProfileImage(id, file);
    }
}
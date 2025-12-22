package com.example.demo.controller;

import com.example.demo.post.Post; // ★追加
import com.example.demo.service.BookmarkService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List; // ★追加

@RestController
@RequestMapping("/users/{userId}/bookmarks")
public class BookmarkController {

    private final BookmarkService bookmarkService;

    public BookmarkController(BookmarkService bookmarkService) {
        this.bookmarkService = bookmarkService;
    }

    // ブックマークの追加・削除 (トグル)
    @PostMapping("/{postId}")
    public ResponseEntity<Void> toggleBookmark(@PathVariable String userId, @PathVariable String postId) {
        bookmarkService.toggleBookmark(userId, postId);
        return ResponseEntity.ok().build();
    }

    // ▼【追加】ブックマーク一覧取得
    @GetMapping
    public ResponseEntity<List<Post>> getBookmarks(@PathVariable String userId) {
        List<Post> posts = bookmarkService.getBookmarkedPosts(userId);
        return ResponseEntity.ok(posts);
    }
}
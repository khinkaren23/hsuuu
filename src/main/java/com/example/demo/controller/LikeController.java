package com.example.demo.controller;

import com.example.demo.like.Like;
import com.example.demo.service.LikeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class LikeController {

    private final LikeService likeService;

    public LikeController(LikeService likeService) {
        this.likeService = likeService;
    }

    @PostMapping("/likes")
    public ResponseEntity<?> createLike(@RequestBody Map<String, String> request) {
        // リクエストボディから ID を取得
        String userId = request.get("userId");
        String postId = request.get("postId");
        String commentId = request.get("commentId");

        // userId がリクエストに含まれていればそれを使用、なければ認証情報から取得を試みる
        if (userId == null || userId.isEmpty()) {
             try {
                userId = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            } catch (Exception e) {
                return new ResponseEntity<>("User ID is required", HttpStatus.BAD_REQUEST);
            }
        }

        // LikeService はトグル（追加 or 削除）ロジックを持つ
        Like result = likeService.createLike(userId, postId, commentId);

        if (result == null) {
            // 解除処理が成功した（nullが返された）場合、204 No Content を返す
            // フロントエンドはこのステータスコードを処理できるはずです
            return ResponseEntity.noContent().build();
        } else {
            // 新規いいねが成功した場合、201 Created を返す
            return new ResponseEntity<>(result, HttpStatus.CREATED);
        }
    }

    @PostMapping("/users/{userId}/likes")
    public ResponseEntity<Like> createLike(
            @PathVariable String userId,
            @RequestParam(required = false) String postId,
            @RequestParam(required = false) String commentId) {
        Like createdLike = likeService.createLike(userId, postId, commentId);
        return new ResponseEntity<>(createdLike, HttpStatus.CREATED);
    }

    @GetMapping("/posts/{postId}/likes")
    public ResponseEntity<List<Like>> getLikesByPost_Id(@PathVariable String postId) {
        List<Like> likes = likeService.getLikesByPost_Id(postId);
        return ResponseEntity.ok(likes);
    }

    @GetMapping("/comments/{commentId}/likes")
    public ResponseEntity<List<Like>> getLikesByComment_Id(@PathVariable String commentId) {
        List<Like> likes = likeService.getLikesByComment_Id(commentId);
        return ResponseEntity.ok(likes);
    }

    @DeleteMapping("/likes/{likeId}")
    public ResponseEntity<Void> deleteLike(@PathVariable String likeId) {
        likeService.deleteLike(likeId);
        return ResponseEntity.noContent().build();
    }
}
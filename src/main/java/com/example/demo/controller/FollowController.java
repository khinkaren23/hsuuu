package com.example.demo.controller;

import com.example.demo.service.FollowService;
import com.example.demo.user.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class FollowController {

    private final FollowService followService;

    public FollowController(FollowService followService) {
        this.followService = followService;
    }

    // フォローの切り替え (POST)
    @PostMapping("/{followedId}/follow")
    public ResponseEntity<?> toggleFollow(
            @PathVariable("followedId") String followedId,  // ★名前を明示
            @RequestParam("followerId") String followerId) { // ★名前を明示
        
        boolean isFollowing = followService.toggleFollow(followerId, followedId);
        return ResponseEntity.ok(Map.of("following", isFollowing));
    }

    // フォロー状態の確認 (GET)
    @GetMapping("/{followedId}/is-following")
    public ResponseEntity<?> checkFollowStatus(
            @PathVariable("followedId") String followedId,  // ★名前を明示
            @RequestParam("followerId") String followerId) { // ★名前を明示
        
        boolean isFollowing = followService.isFollowing(followerId, followedId);
        return ResponseEntity.ok(Map.of("following", isFollowing));
    }

    // フォロワー一覧取得
    @GetMapping("/{userId}/followers-list")
    public ResponseEntity<List<User>> getFollowers(@PathVariable("userId") String userId) {
        return ResponseEntity.ok(followService.getFollowers(userId));
    }

    // フォロー中一覧取得
    @GetMapping("/{userId}/following-list")
    public ResponseEntity<List<User>> getFollowing(@PathVariable("userId") String userId) {
        return ResponseEntity.ok(followService.getFollowing(userId));
    }
}
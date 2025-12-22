package com.example.demo.controller;

import com.example.demo.post.Post;
import com.example.demo.service.PostService;
import com.example.demo.dto.PostRequestDto;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
public class PostController {
    
    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    // ユーザーごとの投稿一覧
    @GetMapping("/users/{userId}/posts")
    public List<Post> getPostsByUserId(@PathVariable String userId, @RequestParam(required = false) String viewingUserId) {
        return postService.getPostsByUserId(userId, viewingUserId);
    }

    // 投稿詳細
    @GetMapping("/posts/{id}")
    public Post getPostById(@PathVariable String id, @RequestParam(required = false) String viewingUserId) {
        return postService.getPostById(id, viewingUserId);
    }

    // 投稿削除
    @DeleteMapping("/posts/{id}")
    public void deletePost(@PathVariable String id, @RequestParam(required = false) String userId) {
        postService.deletePost(id, userId);
    }

    // 投稿更新
    @PutMapping("/posts/{id}")
    public Post updatePost(@PathVariable String id, @Valid @RequestBody PostRequestDto postDto) {
        return postService.updatePost(id, postDto);
    }
    
    // 新規投稿作成 (画像アップロード対応)
    // @ModelAttributeを使うことで、FormData形式のリクエストを受け取れます
    @PostMapping("/users/{userId}/posts")
    public Post createPost(
            @PathVariable String userId,
            @ModelAttribute PostRequestDto postDto,
            @RequestParam(value = "images", required = false) List<MultipartFile> imageFiles) { 
        
        return postService.createPost(userId, postDto, imageFiles);
    }

    // 検索
    @GetMapping("/posts/search")
    public List<Post> searchPosts(@RequestParam String keyword) {
        return postService.searchPosts(keyword);
    }

    @GetMapping("/posts")
    public List<Post> getAllPosts(@RequestParam(required = false) String viewingUserId) {
        return postService.getAllPosts(viewingUserId);
    }


    // リポスト実行
    @PostMapping("/posts/{id}/repost")
    public Post repost(
            @PathVariable String id, // 元の投稿ID
            @RequestParam String userId) { // 誰がリポストしたか
        return postService.repost(userId, id);
    }
}
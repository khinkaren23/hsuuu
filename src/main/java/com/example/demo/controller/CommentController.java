package com.example.demo.controller;

import com.example.demo.comment.Comment;
import com.example.demo.dto.CommentRequestDto;
import com.example.demo.service.CommentService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @PostMapping("/users/{userId}/posts/{postId}/comments")
    public Comment createComment(
            @PathVariable String userId,
            @PathVariable String postId,
            @Valid @RequestBody CommentRequestDto commentDto) {
        return commentService.createComment(userId, postId, commentDto);
    }

    @GetMapping("/posts/{postId}/comments")
    public List<Comment> getCommentsByPostId(@PathVariable String postId, @RequestParam(required = false) String viewingUserId) {
        return commentService.getCommentsByPostId(postId, viewingUserId);
    }

    @DeleteMapping("/comments/{commentId}")
    public void deleteComment(@PathVariable String commentId) {
        commentService.deleteComment(commentId);
    }

    // ▼ このメソッドを追加してください
    @PostMapping("/users/{userId}/comments/{commentId}/replies")
    public Comment createReply(
            @PathVariable String userId,
            @PathVariable String commentId, // 親コメントのID
            @Valid @RequestBody CommentRequestDto commentDto) {
        
        // Serviceに「返信作成」を依頼する
        // ※注意: CommentService側に createReply メソッドを作る必要があります
        return commentService.createReply(userId, commentId, commentDto);
    }
}
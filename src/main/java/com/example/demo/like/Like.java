package com.example.demo.like;

public class Like {

    private String id;
    private String userId;
    private String postId;    // コメントへのいいねの場合はnull
    private String commentId; // 投稿へのいいねの場合はnull
    private String createdAt;

    public Like() {}

    // Getter / Setter
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getPostId() { return postId; }
    public void setPostId(String postId) { this.postId = postId; }

    public String getCommentId() { return commentId; }
    public void setCommentId(String commentId) { this.commentId = commentId; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
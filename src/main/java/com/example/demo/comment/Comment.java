package com.example.demo.comment;

import com.example.demo.user.User;
import com.google.cloud.firestore.annotation.Exclude;

public class Comment {
    private String id;
    private String userId;
    private String postId;
    private String content;
    private String createdAt;
    private String parentId;

    // ▼【追加】いいね数
    private int likeCount = 0;

    // ▼【追加】自分がいいねしたかどうか
    @Exclude
    private boolean likedByCurrentUser;

    @Exclude
    private User user; 

    public Comment() {}

    // Getter / Setter
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getPostId() { return postId; }
    public void setPostId(String postId) { this.postId = postId; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getParentId() { return parentId; }
    public void setParentId(String parentId) { this.parentId = parentId; }

    // ▼【追加】
    public int getLikeCount() { return likeCount; }
    public void setLikeCount(int likeCount) { this.likeCount = likeCount; }

    @Exclude
    public boolean isLikedByCurrentUser() { return likedByCurrentUser; }
    @Exclude
    public void setLikedByCurrentUser(boolean likedByCurrentUser) { this.likedByCurrentUser = likedByCurrentUser; }

    @Exclude
    public User getUser() { return user; }
    @Exclude
    public void setUser(User user) { this.user = user; }
}
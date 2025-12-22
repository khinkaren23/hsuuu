package com.example.demo.post;

import com.example.demo.user.User;
import com.google.cloud.firestore.annotation.Exclude;
import java.util.List;

public class Post {
    private String id;
    private String userId;
    private String content;
    private List<String> imageUrls;
    private String createdAt;
    private String repostId; 
    private int likeCount = 0;
    private int commentCount = 0;

    @Exclude
    private Post repostedPost;
    @Exclude 
    private User user; 

    // ▼【追加】自分がいいねしたかどうか（DBには保存しない）
    @Exclude
    private boolean likedByCurrentUser;

    // ▼【追加】自分がブックマークしたかどうか（DBには保存しない）
    @Exclude
    private boolean bookmarkedByCurrentUser;

    public Post() {}

    // --- Getter / Setter ---
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public List<String> getImageUrls() { return imageUrls; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getRepostId() { return repostId; }
    public void setRepostId(String repostId) { this.repostId = repostId; }
    public int getLikeCount() { return likeCount; }
    public void setLikeCount(int likeCount) { this.likeCount = likeCount; }
    public int getCommentCount() { return commentCount; }
    public void setCommentCount(int commentCount) { this.commentCount = commentCount; }
    
    @Exclude
    public Post getRepostedPost() { return repostedPost; }
    @Exclude
    public void setRepostedPost(Post repostedPost) { this.repostedPost = repostedPost; }
    @Exclude
    public User getUser() { return user; }
    @Exclude
    public void setUser(User user) { this.user = user; }

    // ▼【追加】Getter/Setter
    @Exclude
    public boolean isLikedByCurrentUser() { return likedByCurrentUser; }
    @Exclude
    public void setLikedByCurrentUser(boolean likedByCurrentUser) { this.likedByCurrentUser = likedByCurrentUser; }

    @Exclude
    public boolean isBookmarkedByCurrentUser() { return bookmarkedByCurrentUser; }
    @Exclude
    public void setBookmarkedByCurrentUser(boolean bookmarkedByCurrentUser) { this.bookmarkedByCurrentUser = bookmarkedByCurrentUser; }
}
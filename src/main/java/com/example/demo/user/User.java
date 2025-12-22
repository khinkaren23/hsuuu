package com.example.demo.user;

public class User {

    private String id; // UUIDではなくString
    private String username;
    private String profileImageUrl;
    private String createdAt; // 日付も文字列で扱うのが簡単です

    // カウント用（Firestoreには保存しない）
    private int followingCount;
    private int followerCount;

    // Firestoreには空のコンストラクタが必須
    public User() {}

    // Getter / Setter
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }
    
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    // Firestoreの読み書き対象から除外するが、JSONには含める
    @com.google.cloud.firestore.annotation.Exclude
    public int getFollowingCount() { return followingCount; }
    public void setFollowingCount(int followingCount) { this.followingCount = followingCount; }

    @com.google.cloud.firestore.annotation.Exclude
    public int getFollowerCount() { return followerCount; }
    public void setFollowerCount(int followerCount) { this.followerCount = followerCount; }
}
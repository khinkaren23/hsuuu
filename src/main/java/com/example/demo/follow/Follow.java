package com.example.demo.follow;

public class Follow {
    private String id;
    private String followerId; // フォローした人（自分）
    private String followedId; // フォローされた人（相手）
    private String createdAt;

    public Follow() {}

    public Follow(String followerId, String followedId, String createdAt) {
        this.followerId = followerId;
        this.followedId = followedId;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getFollowerId() { return followerId; }
    public void setFollowerId(String followerId) { this.followerId = followerId; }

    public String getFollowedId() { return followedId; }
    public void setFollowedId(String followedId) { this.followedId = followedId; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    @Override
    public String toString() {
        return "Follow{" +
                "id='" + id + '\'' +
                ", followerId='" + followerId + '\'' +
                ", followedId='" + followedId + '\'' +
                ", createdAt='" + createdAt + '\'' +
                '}';
    }
}
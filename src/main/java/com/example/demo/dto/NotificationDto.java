package com.example.demo.dto;

public class NotificationDto {
    // 通知を送ってきた人の情報
    private String fromUserName;
    private String fromUserAvatar;
    
    // 対象の投稿情報
    private String postId;
    private String postImage; // 投稿画像の1枚目など
    private String caption;   // 投稿本文
    private String postUserName; // 投稿者名（自分）

    // コメント通知用
    private String commentText;

    // ソート用日時
    private String createdAt;

    // コンストラクタ
    public NotificationDto() {}

    // --- Getter / Setter ---
    public String getFromUserName() { return fromUserName; }
    public void setFromUserName(String fromUserName) { this.fromUserName = fromUserName; }

    public String getFromUserAvatar() { return fromUserAvatar; }
    public void setFromUserAvatar(String fromUserAvatar) { this.fromUserAvatar = fromUserAvatar; }

    public String getPostId() { return postId; }
    public void setPostId(String postId) { this.postId = postId; }

    public String getPostImage() { return postImage; }
    public void setPostImage(String postImage) { this.postImage = postImage; }

    public String getCaption() { return caption; }
    public void setCaption(String caption) { this.caption = caption; }

    public String getPostUserName() { return postUserName; }
    public void setPostUserName(String postUserName) { this.postUserName = postUserName; }

    public String getCommentText() { return commentText; }
    public void setCommentText(String commentText) { this.commentText = commentText; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
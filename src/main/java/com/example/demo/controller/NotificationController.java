package com.example.demo.controller;

import com.example.demo.comment.Comment;
import com.example.demo.comment.CommentRepository;
import com.example.demo.dto.NotificationDto;
import com.example.demo.like.Like;
import com.example.demo.like.LikeRepository;
import com.example.demo.post.Post;
import com.example.demo.post.PostRepository;
import com.example.demo.user.User;
import com.example.demo.user.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.util.Comparator;

@RestController
@RequestMapping("/api") // 接頭辞をまとめる
public class NotificationController {

    private final PostRepository postRepository;
    private final LikeRepository likeRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;

    public NotificationController(PostRepository postRepository, LikeRepository likeRepository, CommentRepository commentRepository, UserRepository userRepository) {
        this.postRepository = postRepository;
        this.likeRepository = likeRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
    }

    // ■ いいね通知
    @GetMapping("/notifications/likes")
    public List<NotificationDto> getLikeNotifications(@RequestParam(required = false) String userId) {
        if (userId == null || userId.isEmpty()) return new ArrayList<>();

        List<NotificationDto> notifications = new ArrayList<>();
        
        // 1. 自分の投稿をすべて取得
        List<Post> myPosts = postRepository.findByUserId(userId);

        for (Post post : myPosts) {
            // 2. 各投稿についた「いいね」を取得
            List<Like> likes = likeRepository.findByPostId(post.getId());
            
            for (Like like : likes) {
                // 自分で自分にいいねした場合は通知しない
                if (like.getUserId().equals(userId)) continue;

                // 3. いいねした人の情報を取得
                userRepository.findById(like.getUserId()).ifPresent(liker -> {
                    NotificationDto dto = new NotificationDto();
                    dto.setFromUserName(liker.getUsername());
                    dto.setFromUserAvatar(liker.getProfileImageUrl());
                    dto.setPostId(post.getId());
                    dto.setCaption(post.getContent());
                    
                    // 画像があればセット
                    if (post.getImageUrls() != null && !post.getImageUrls().isEmpty()) {
                        dto.setPostImage(post.getImageUrls().get(0));
                    }
                    
                    // 投稿者名（自分）をセット（モーダル表示用）
                    userRepository.findById(userId).ifPresent(me -> dto.setPostUserName(me.getUsername()));

                    // 日時セット
                    dto.setCreatedAt(like.getCreatedAt());

                    notifications.add(dto);
                });
            }
        }
        // 新しい順にソート
        notifications.sort((a, b) -> {
            String t1 = a.getCreatedAt() != null ? a.getCreatedAt() : "";
            String t2 = b.getCreatedAt() != null ? b.getCreatedAt() : "";
            return t2.compareTo(t1); // 降順
        });
        return notifications;
    }

    // ■ コメント通知
    @GetMapping("/notifications/comments")
    public List<NotificationDto> getCommentNotifications(@RequestParam(required = false) String userId) {
        if (userId == null || userId.isEmpty()) return new ArrayList<>();

        List<NotificationDto> notifications = new ArrayList<>();
        Set<String> processedCommentIds = new HashSet<>();

        // 1. 自分の投稿へのコメント
        List<Post> myPosts = postRepository.findByUserId(userId);

        for (Post post : myPosts) {
            List<Comment> comments = commentRepository.findByPostId(post.getId());
            for (Comment comment : comments) {
                if (comment.getUserId().equals(userId)) continue;
                if (processedCommentIds.contains(comment.getId())) continue;

                userRepository.findById(comment.getUserId()).ifPresent(commenter -> {
                    NotificationDto dto = new NotificationDto();
                    dto.setFromUserName(commenter.getUsername());
                    dto.setFromUserAvatar(commenter.getProfileImageUrl());
                    dto.setPostId(post.getId());
                    dto.setCaption(post.getContent());
                    dto.setCommentText(comment.getContent());
                    dto.setCreatedAt(comment.getCreatedAt());
                    
                    notifications.add(dto);
                    processedCommentIds.add(comment.getId());
                });
            }
        }

        // 2. 自分のコメントへの返信
        List<Comment> myComments = commentRepository.findByUserId(userId);
        for (Comment myComment : myComments) {
            List<Comment> replies = commentRepository.findByParentId(myComment.getId());
            for (Comment reply : replies) {
                if (reply.getUserId().equals(userId)) continue;
                if (processedCommentIds.contains(reply.getId())) continue;

                // 投稿情報を取得
                postRepository.findById(reply.getPostId()).ifPresent(post -> {
                    userRepository.findById(reply.getUserId()).ifPresent(replier -> {
                        NotificationDto dto = new NotificationDto();
                        dto.setFromUserName(replier.getUsername());
                        dto.setFromUserAvatar(replier.getProfileImageUrl());
                        dto.setPostId(post.getId());
                        dto.setCaption(post.getContent());
                        dto.setCommentText(reply.getContent());
                        dto.setCreatedAt(reply.getCreatedAt());

                        notifications.add(dto);
                        processedCommentIds.add(reply.getId());
                    });
                });
            }
        }

        // 日付順（新しい順）にソート
        notifications.sort((a, b) -> {
            String t1 = a.getCreatedAt() != null ? a.getCreatedAt() : "";
            String t2 = b.getCreatedAt() != null ? b.getCreatedAt() : "";
            return t2.compareTo(t1); // 降順
        });

        return notifications;
    }

    // ■ フォロワー通知 (ダミー: 空リストを返す)
    @GetMapping("/notifications/followers")
    public List<NotificationDto> getFollowerNotifications(@RequestParam(required = false) String userId) {
        return new ArrayList<>(); 
    }

    // ■ フォロワー一覧 (ダミー)
    @GetMapping("/followers")
    public List<NotificationDto> getFollowers(@RequestParam(required = false) String userId) {
        return new ArrayList<>();
    }

    // ■ ブックマーク (ダミー)
    @GetMapping("/bookmarks")
    public List<NotificationDto> getBookmarks(@RequestParam(required = false) String userId) {
        return new ArrayList<>();
    }
}
package com.example.demo.service;

import com.example.demo.comment.Comment;
import com.example.demo.comment.CommentRepository;
import com.example.demo.dto.CommentRequestDto;
import com.example.demo.post.Post;
import com.example.demo.post.PostRepository;
import com.example.demo.user.UserRepository;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.like.LikeRepository;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final LikeRepository likeRepository;

    public CommentService(CommentRepository commentRepository, UserRepository userRepository, PostRepository postRepository, LikeRepository likeRepository) {
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.postRepository = postRepository;
        this.likeRepository = likeRepository;
    }

    // 修正版：重複をなくし、カウントアップ処理を入れたもの
    public Comment createComment(String userId, String postId, CommentRequestDto commentDto) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        // 投稿を取得
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        Comment comment = new Comment();
        comment.setUserId(userId);
        comment.setPostId(postId);
        comment.setContent(commentDto.getContent());
        comment.setCreatedAt(LocalDateTime.now().toString());

        // ▼ カウントアップして保存
        post.setCommentCount(post.getCommentCount() + 1);
        postRepository.save(post);

        return commentRepository.save(comment);
    }

    // ▼ このメソッドを追加してください
    public Comment createReply(String userId, String commentId, CommentRequestDto commentDto) {
        // 1. ユーザーの存在確認
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // 2. 親コメントの存在確認
        Comment parentComment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Parent comment not found"));

        // 3. 親コメントが属している投稿IDを取得（返信も同じ投稿に紐づけるため）
        String postId = parentComment.getPostId();
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        // 4. 新しい返信コメントを作成
        Comment reply = new Comment();
        reply.setUserId(userId);
        reply.setPostId(postId);          // 返信も元の投稿の一部として扱う
        reply.setParentId(commentId);     // ★重要：親コメントのIDをセット
        reply.setContent(commentDto.getContent());
        reply.setCreatedAt(LocalDateTime.now().toString());

        // 5. 投稿全体のコメント数をカウントアップ
        post.setCommentCount(post.getCommentCount() + 1);
        postRepository.save(post);

        // 6. 保存
        return commentRepository.save(reply);
    }

    // ... (imports, fields, constructor, createComment, createReply は省略) ...

    // ▼【修正】引数を追加して、いいね状態をセット
    public List<Comment> getCommentsByPostId(String postId, String viewingUserId) {
        List<Comment> comments = commentRepository.findByPostId(postId);
        
        // 現在のユーザーIDを取得（viewingUserId が null の場合は認証情報から取得を試みる）
        String currentUserId = viewingUserId;
        if (currentUserId == null || currentUserId.isEmpty() || currentUserId.equals("anonymousUser")) {
            try {
                Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
                if (principal instanceof String && !((String) principal).equals("anonymousUser")) {
                    currentUserId = (String) principal;
                }
            } catch (Exception e) {}
        }

        for (Comment comment : comments) {
            // ユーザー情報をセット
            userRepository.findById(comment.getUserId())
                    .ifPresent(user -> comment.setUser(user));
            
            // ★いいね状態をセット
            if (currentUserId != null && !currentUserId.equals("anonymousUser")) {
                boolean isLiked = likeRepository.existsByComment(currentUserId, comment.getId());
                comment.setLikedByCurrentUser(isLiked);
            }
        }
        return comments;
    }

    // ▼【確認】前回消してしまった deleteComment メソッドを復活させてください
    public void deleteComment(String commentId) {
        commentRepository.deleteById(commentId);
    }
}
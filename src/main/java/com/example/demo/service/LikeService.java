package com.example.demo.service;

import com.example.demo.comment.Comment;
import com.example.demo.comment.CommentRepository;
import com.example.demo.like.Like;
import com.example.demo.like.LikeRepository;
import com.example.demo.post.Post;
import com.example.demo.post.PostRepository;
import com.example.demo.user.UserRepository;
import com.example.demo.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class LikeService {

    private final LikeRepository likeRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;

    public LikeService(LikeRepository likeRepository, UserRepository userRepository, PostRepository postRepository, CommentRepository commentRepository) {
        this.likeRepository = likeRepository;
        this.userRepository = userRepository;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
    }

    // ★修正：既にいいねがあれば削除、なければ作成（トグル機能）
    public Like createLike(String userId, String postId, String commentId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // --- 投稿へのいいね ---
        if (postId != null) {
            Post post = postRepository.findById(postId)
                    .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
            
            // 既にいいねしているかチェック
            if (likeRepository.existsByPost(userId, postId)) {
                // ★解除処理
                // 本当はlikeIdを探して消すべきだが、簡易的にクエリで探して消すロジックが必要
                // ここでは簡易実装として「解除しました」という意味で null を返すか、
                // リポジトリに deleteByUserIdAndPostId を作るのが正解ですが、
                // 既存メソッドを使ってリストから探して消します。
                List<Like> existingLikes = likeRepository.findByPostId(postId);
                for (Like l : existingLikes) {
                    if (l.getUserId().equals(userId)) {
                        likeRepository.deleteById(l.getId());
                        break;
                    }
                }
                // カウントダウン
                post.setLikeCount(Math.max(0, post.getLikeCount() - 1));
                postRepository.save(post);
                return null; // 解除時はnullを返すことにする
            }

            // 新規いいね
            Like newLike = new Like();
            newLike.setUserId(userId);
            newLike.setPostId(postId);
            newLike.setCreatedAt(LocalDateTime.now().toString());
            
            post.setLikeCount(post.getLikeCount() + 1);
            postRepository.save(post);
            return likeRepository.save(newLike);

        } 
        // --- コメントへのいいね ---
        else if (commentId != null) {
            Comment comment = commentRepository.findById(commentId)
                     .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

            if (likeRepository.existsByComment(userId, commentId)) {
                // ★解除処理
                List<Like> existingLikes = likeRepository.findByCommentId(commentId);
                for (Like l : existingLikes) {
                    if (l.getUserId().equals(userId)) {
                        likeRepository.deleteById(l.getId());
                        break;
                    }
                }
                // カウントダウン
                comment.setLikeCount(Math.max(0, comment.getLikeCount() - 1));
                commentRepository.save(comment);
                return null;
            }

            // 新規いいね
            Like newLike = new Like();
            newLike.setUserId(userId);
            newLike.setCommentId(commentId);
            newLike.setCreatedAt(LocalDateTime.now().toString());

            // カウントアップ
            comment.setLikeCount(comment.getLikeCount() + 1);
            commentRepository.save(comment);
            return likeRepository.save(newLike);
        } else {
            throw new IllegalArgumentException("Either postId or commentId is required");
        }
    }

    public List<Like> getLikesByPost_Id(String postId) {
        return likeRepository.findByPostId(postId);
    }

    public List<Like> getLikesByComment_Id(String commentId) {
        return likeRepository.findByCommentId(commentId);
    }

    public void deleteLike(String likeId) {
        // ID指定削除（念のため残す）
        likeRepository.deleteById(likeId);
    }
}
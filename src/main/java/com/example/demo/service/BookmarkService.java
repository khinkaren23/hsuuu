package com.example.demo.service;

import com.example.demo.bookmark.Bookmark;
import com.example.demo.bookmark.BookmarkRepository;
import com.example.demo.post.Post;
import com.example.demo.post.PostRepository;
import com.example.demo.user.UserRepository;
import com.example.demo.like.LikeRepository; // ★追加
import com.example.demo.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class BookmarkService {

    private final BookmarkRepository bookmarkRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final LikeRepository likeRepository; // ★追加

    // コンストラクタ修正
    public BookmarkService(BookmarkRepository bookmarkRepository, PostRepository postRepository, UserRepository userRepository, LikeRepository likeRepository) {
        this.bookmarkRepository = bookmarkRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.likeRepository = likeRepository;
    }

    public void toggleBookmark(String userId, String postId) {
        // 投稿が存在するか確認
        postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found: " + postId));

        if (bookmarkRepository.existsByUserIdAndPostId(userId, postId)) {
            // 既にブックマーク済みの場合は削除
            bookmarkRepository.deleteByUserIdAndPostId(userId, postId);
        } else {
            // ブックマーク追加
            Bookmark bookmark = new Bookmark(userId, postId, LocalDateTime.now().toString());
            bookmarkRepository.save(bookmark);
        }
    }

    // ▼【追加】ブックマーク一覧を取得するメソッド
    public List<Post> getBookmarkedPosts(String userId) {
        List<Bookmark> bookmarks = bookmarkRepository.findByUserId(userId);
        
        // ブックマークした日時順（新しい順）にソート
        bookmarks.sort((a, b) -> {
            String t1 = a.getCreatedAt() != null ? a.getCreatedAt() : "";
            String t2 = b.getCreatedAt() != null ? b.getCreatedAt() : "";
            return t2.compareTo(t1);
        });

        if (bookmarks.isEmpty()) {
            return new ArrayList<>();
        }

        // 1. 投稿IDのリストを作成
        List<String> postIds = bookmarks.stream()
                .map(Bookmark::getPostId)
                .distinct()
                .toList();

        // 2. 投稿を一括取得
        List<Post> fetchedPosts = postRepository.findAllById(postIds);
        java.util.Map<String, Post> postMap = fetchedPosts.stream()
                .collect(java.util.stream.Collectors.toMap(Post::getId, p -> p));

        // 3. 投稿者のIDリストを作成
        List<String> userIds = fetchedPosts.stream()
                .map(Post::getUserId)
                .distinct()
                .toList();

        // 4. ユーザー情報を一括取得
        List<com.example.demo.user.User> users = userRepository.findAllById(userIds);
        java.util.Map<String, com.example.demo.user.User> userMap = users.stream()
                .collect(java.util.stream.Collectors.toMap(com.example.demo.user.User::getId, u -> u));

        // 5. いいね状態を一括取得
        List<String> likedPostIds = likeRepository.findLikedPostIdsByUserIdAndPostIds(userId, postIds);
        java.util.Set<String> likedPostIdSet = new java.util.HashSet<>(likedPostIds);

        // 6. 結果リストの構築 (ブックマーク順を維持)
        List<Post> resultPosts = new ArrayList<>();
        for (Bookmark bookmark : bookmarks) {
            Post post = postMap.get(bookmark.getPostId());
            if (post != null) {
                // ユーザー情報をセット
                if (post.getUserId() != null) {
                    post.setUser(userMap.get(post.getUserId()));
                }
                
                // いいね状態をセット
                post.setLikedByCurrentUser(likedPostIdSet.contains(post.getId()));

                // ブックマーク状態をセット (ここはブックマーク一覧なので必ずtrue)
                post.setBookmarkedByCurrentUser(true);

                resultPosts.add(post);
            }
        }
        return resultPosts;
    }
};
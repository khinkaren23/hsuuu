package com.example.demo.service;

import com.example.demo.post.Post;
import com.example.demo.post.PostRepository;
import com.example.demo.user.UserRepository;
import com.example.demo.like.LikeRepository;
import com.example.demo.bookmark.BookmarkRepository; // ★追加
import com.example.demo.dto.PostRequestDto;
import com.example.demo.exception.ResourceNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final LikeRepository likeRepository;
    private final BookmarkRepository bookmarkRepository; // ★追加

    // コンストラクタに BookmarkRepository を追加
    public PostService(PostRepository postRepository, UserRepository userRepository, FileStorageService fileStorageService, LikeRepository likeRepository, BookmarkRepository bookmarkRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
        this.likeRepository = likeRepository;
        this.bookmarkRepository = bookmarkRepository; // ★追加
    }

    public Post createPost(String userId, PostRequestDto postDto, List<MultipartFile> imageFiles) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        Post newPost = new Post();
        newPost.setContent(postDto.getContent());
        newPost.setUserId(userId);
        newPost.setCreatedAt(LocalDateTime.now().toString());

        if (imageFiles != null && !imageFiles.isEmpty()) {
            List<String> imageUrls = new ArrayList<>();
            for (MultipartFile file : imageFiles) {
                if (!file.isEmpty()) {
                    imageUrls.add(fileStorageService.storeFile(file));
                }
            }
            newPost.setImageUrls(imageUrls);
        }
        
        return postRepository.save(newPost);
    }

    public Post repost(String userId, String originalPostId) {
        Post originalPost = postRepository.findById(originalPostId)
                .orElseThrow(() -> new ResourceNotFoundException("Original post not found"));

        Post repost = new Post();
        repost.setUserId(userId);
        repost.setRepostId(originalPostId); // 元の投稿IDをセット
        repost.setCreatedAt(LocalDateTime.now().toString());
        
        return postRepository.save(repost);
    }

    // ▼【修正】引数を追加 (N+1対策済み)
    public List<Post> getAllPosts(String viewingUserId) {
        List<Post> posts = postRepository.findAll();
        attachDataToPosts(posts, viewingUserId);
        return posts;
    }

    // ▼【修正】引数を追加 (N+1対策済み)
    public List<Post> getPostsByUserId(String userId, String viewingUserId) {
        List<Post> posts = postRepository.findByUserId(userId);
        attachDataToPosts(posts, viewingUserId);
        return posts;
    }

    // ▼【追加】一括データ取得・結合メソッド (N+1対策)
    private void attachDataToPosts(List<Post> posts, String viewingUserId) {
        if (posts.isEmpty()) return;

        // 1. 必要なIDを収集
        List<String> userIds = new ArrayList<>();
        List<String> repostIds = new ArrayList<>();
        List<String> postIds = new ArrayList<>();

        for (Post post : posts) {
            if (post.getUserId() != null) userIds.add(post.getUserId());
            if (post.getRepostId() != null) repostIds.add(post.getRepostId());
            postIds.add(post.getId());
        }

        // 2. ユーザー情報の一括取得
        List<com.example.demo.user.User> users = userRepository.findAllById(userIds.stream().distinct().toList());
        java.util.Map<String, com.example.demo.user.User> userMap = users.stream()
                .collect(java.util.stream.Collectors.toMap(com.example.demo.user.User::getId, u -> u));

        // 3. リポスト元投稿の一括取得
        List<Post> repostedPosts = postRepository.findAllById(repostIds.stream().distinct().toList());
        java.util.Map<String, Post> repostMap = repostedPosts.stream()
                .collect(java.util.stream.Collectors.toMap(Post::getId, p -> p));

        // 4. リポスト元のユーザーID収集 & 取得
        List<String> repostUserIds = repostedPosts.stream()
                .map(Post::getUserId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();
        List<com.example.demo.user.User> repostUsers = userRepository.findAllById(repostUserIds);
        java.util.Map<String, com.example.demo.user.User> repostUserMap = repostUsers.stream()
                .collect(java.util.stream.Collectors.toMap(com.example.demo.user.User::getId, u -> u));

        // 5. いいね・ブックマーク状態の一括取得 (閲覧者がいる場合)
        java.util.Set<String> likedPostIds = new java.util.HashSet<>();
        java.util.Set<String> bookmarkedPostIds = new java.util.HashSet<>();

        // viewingUserIdがnullの場合、SecurityContextから取得を試みる
        if (viewingUserId == null || viewingUserId.isEmpty()) {
            try {
                Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
                if (principal instanceof String && !((String) principal).equals("anonymousUser")) {
                    viewingUserId = (String) principal;
                }
            } catch (Exception e) { /* 無視 */ }
        }

        if (viewingUserId != null && !viewingUserId.isEmpty() && !viewingUserId.equals("anonymousUser")) {
            likedPostIds.addAll(likeRepository.findLikedPostIdsByUserIdAndPostIds(viewingUserId, postIds));
            bookmarkedPostIds.addAll(bookmarkRepository.findBookmarkedPostIdsByUserIdAndPostIds(viewingUserId, postIds));
        }

        // 6. データ結合
        for (Post post : posts) {
            // ユーザーセット
            if (post.getUserId() != null) {
                post.setUser(userMap.get(post.getUserId()));
            }

            // リポストセット
            if (post.getRepostId() != null) {
                Post original = repostMap.get(post.getRepostId());
                if (original != null) {
                    if (original.getUserId() != null) {
                        original.setUser(repostUserMap.get(original.getUserId()));
                    }
                    post.setRepostedPost(original);
                }
            }

            // ステータスセット
            post.setLikedByCurrentUser(likedPostIds.contains(post.getId()));
            post.setBookmarkedByCurrentUser(bookmarkedPostIds.contains(post.getId()));
        }
    }

    public List<Post> searchPosts(String keyword) {
        System.out.println("【検索デバッグ】キーワード: [" + keyword + "]");
        // 検索時は一旦 viewingUserId なし(null)で取得
        List<Post> allPosts = getAllPosts(null);
        
        if (keyword == null || keyword.trim().isEmpty()) {
            return allPosts;
        }

        List<Post> result = new ArrayList<>();
        for (Post p : allPosts) {
            if (p.getContent() != null && p.getContent().contains(keyword)) {
                result.add(p);
            }
        }
        return result;
    }

    public Post getPostById(String id, String viewingUserId) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found: " + id));
        attachUserToPost(post, viewingUserId);
        return post;
    }

    // 後方互換性のため（必要なら）
    public Post getPostById(String id) {
        return getPostById(id, null);
    }

    // 削除メソッドの更新：userIdを受け取ってチェックする
    public void deletePost(String id, String userId) {
        Post post = getPostById(id);
        
        // userIdが指定されている場合は、そのユーザーが投稿者かチェック
        if (userId != null && !userId.isEmpty()) {
            if (!post.getUserId().equals(userId)) {
                throw new AccessDeniedException("Not authorized to delete this post");
            }
        } else {
            // userIdがない場合は従来のSecurityContextチェック
            checkAuthorization(post);
        }
        
        postRepository.deleteById(id);
    }

    // 後方互換性のために残す（必要なら）
    public void deletePost(String id) {
        deletePost(id, null);
    }

    public Post updatePost(String id, PostRequestDto postDto) {
        Post post = getPostById(id);
        checkAuthorization(post);
        post.setContent(postDto.getContent());
        return postRepository.save(post);
    }

    private void checkAuthorization(Post post) {
        String currentUserId = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!currentUserId.equals(post.getUserId())) {
            throw new AccessDeniedException("Not authorized to modify this post");
        }
    }

    // ▼【修正】ユーザー情報付与に加え、いいね状態もセットする
    private void attachUserToPost(Post post, String viewingUserId) {
        // ユーザー情報の取得
        if (post.getUserId() != null) {
            userRepository.findById(post.getUserId())
                    .ifPresent(user -> post.setUser(user));
        }
        // リポスト元の取得
        if (post.getRepostId() != null) {
            postRepository.findById(post.getRepostId()).ifPresent(origin -> {
                if (origin.getUserId() != null) {
                    userRepository.findById(origin.getUserId())
                            .ifPresent(originUser -> origin.setUser(originUser));
                }
                post.setRepostedPost(origin);
            });
        }

        // ★いいね状態の判定ロジック
        String currentUserId = viewingUserId;
        
        // viewingUserIdが渡されなかった場合、認証情報からの取得を試みる（フォールバック）
        if (currentUserId == null || currentUserId.isEmpty()) {
            try {
                Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
                if (principal instanceof String && !((String) principal).equals("anonymousUser")) {
                    currentUserId = (String) principal;
                }
            } catch (Exception e) {
                // 無視
            }
        }

        // 判定実行
        if (currentUserId != null && !currentUserId.isEmpty() && !currentUserId.equals("anonymousUser")) {
            boolean isLiked = likeRepository.existsByPost(currentUserId, post.getId());
            post.setLikedByCurrentUser(isLiked);

            // ブックマーク状態の判定
            boolean isBookmarked = bookmarkRepository.existsByUserIdAndPostId(currentUserId, post.getId());
            post.setBookmarkedByCurrentUser(isBookmarked);
        }
    }
}
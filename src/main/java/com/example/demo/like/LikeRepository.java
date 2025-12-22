package com.example.demo.like;

import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
public class LikeRepository {

    private Firestore getDb() {
        return FirestoreClient.getFirestore();
    }

    public Like save(Like like) {
        try {
            if (like.getId() == null) {
                like.setId(getDb().collection("likes").document().getId());
            }
            getDb().collection("likes").document(like.getId()).set(like).get();
            return like;
        } catch (Exception e) {
            throw new RuntimeException("Like save failed", e);
        }
    }

    public void deleteById(String id) {
        getDb().collection("likes").document(id).delete();
    }

    // ▼【追加】削除処理用
    public Like findById(String id) {
        try {
            DocumentSnapshot doc = getDb().collection("likes").document(id).get().get();
            if (doc.exists()) {
                return doc.toObject(Like.class);
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    public List<Like> findByPostId(String postId) {
        return findByField("postId", postId);
    }

    public List<Like> findByCommentId(String commentId) {
         return findByField("commentId", commentId);
    }

    private List<Like> findByField(String field, String value) {
        try {
            List<Like> list = new ArrayList<>();
            QuerySnapshot query = getDb().collection("likes")
                    .whereEqualTo(field, value)
                    .get().get();
            for (DocumentSnapshot doc : query.getDocuments()) {
                list.add(doc.toObject(Like.class));
            }
            return list;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public boolean existsByPost(String userId, String postId) {
        return checkExists(userId, "postId", postId);
    }

    public boolean existsByComment(String userId, String commentId) {
        return checkExists(userId, "commentId", commentId);
    }

    private boolean checkExists(String userId, String targetField, String targetId) {
        try {
            QuerySnapshot query = getDb().collection("likes")
                    .whereEqualTo("userId", userId)
                    .whereEqualTo(targetField, targetId)
                    .limit(1)
                    .get().get();
            return !query.isEmpty();
        } catch (Exception e) {
            return false;
        }
    }

    // ▼【追加】メソッド名の互換性のため
    public boolean existsByUserIdAndPostId(String userId, String postId) {
        return existsByPost(userId, postId);
    }

    // ▼【追加】バッチ取得用: 指定された投稿IDリストのうち、ユーザーがいいねしている投稿IDのリストを返す
    public List<String> findLikedPostIdsByUserIdAndPostIds(String userId, List<String> postIds) {
        if (postIds == null || postIds.isEmpty()) return new ArrayList<>();

        List<String> likedPostIds = new ArrayList<>();
        int batchSize = 10; // Firestore whereIn limit

        for (int i = 0; i < postIds.size(); i += batchSize) {
            List<String> batchIds = postIds.subList(i, Math.min(i + batchSize, postIds.size()));
            try {
                QuerySnapshot query = getDb().collection("likes")
                        .whereEqualTo("userId", userId)
                        .whereIn("postId", batchIds)
                        .get()
                        .get();
                
                for (DocumentSnapshot doc : query.getDocuments()) {
                    Like like = doc.toObject(Like.class);
                    if (like != null && like.getPostId() != null) {
                        likedPostIds.add(like.getPostId());
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return likedPostIds;
    }
}
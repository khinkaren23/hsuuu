package com.example.demo.comment;

import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class CommentRepository {

    private Firestore getDb() {
        return FirestoreClient.getFirestore();
    }

    public Comment save(Comment comment) {
        try {
            if (comment.getId() == null) {
                comment.setId(getDb().collection("comments").document().getId());
            }
            getDb().collection("comments").document(comment.getId()).set(comment).get();
            return comment;
        } catch (Exception e) {
            throw new RuntimeException("Comment save failed", e);
        }
    }

    // 特定の投稿に関連するコメントを取得
    public List<Comment> findByPostId(String postId) {
        try {
            List<Comment> list = new ArrayList<>();
            // "postId" でフィルタリング
            QuerySnapshot query = getDb().collection("comments")
                    .whereEqualTo("postId", postId)
                    .get().get();

            for (DocumentSnapshot doc : query.getDocuments()) {
                list.add(doc.toObject(Comment.class));
            }
            // 日付順のソートはJava側で行うか、Firestoreでインデックスを作成して .orderBy() を追加します
            return list;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public void deleteById(String id) {
        getDb().collection("comments").document(id).delete();
    }

    public List<Comment> findByUserId(String userId) {
        try {
            List<Comment> list = new ArrayList<>();
            QuerySnapshot query = getDb().collection("comments")
                    .whereEqualTo("userId", userId)
                    .get().get();
            for (DocumentSnapshot doc : query.getDocuments()) {
                list.add(doc.toObject(Comment.class));
            }
            return list;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public List<Comment> findByParentId(String parentId) {
        try {
            List<Comment> list = new ArrayList<>();
            QuerySnapshot query = getDb().collection("comments")
                    .whereEqualTo("parentId", parentId)
                    .get().get();
            for (DocumentSnapshot doc : query.getDocuments()) {
                list.add(doc.toObject(Comment.class));
            }
            return list;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
    
    public Optional<Comment> findById(String id) {
         try {
            DocumentSnapshot doc = getDb().collection("comments").document(id).get().get();
            if (doc.exists()) {
                return Optional.ofNullable(doc.toObject(Comment.class));
            }
            return Optional.empty();
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
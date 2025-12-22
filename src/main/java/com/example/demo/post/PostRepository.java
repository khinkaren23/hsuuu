package com.example.demo.post;

import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class PostRepository {

    private Firestore getDb() {
        return FirestoreClient.getFirestore();
    }

    public Post save(Post post) {
        try {
            if (post.getId() == null) {
                post.setId(getDb().collection("posts").document().getId());
            }
            // Userオブジェクトは @Exclude なので保存されず、userIdだけ保存される
            getDb().collection("posts").document(post.getId()).set(post).get();
            return post;
        } catch (Exception e) {
            throw new RuntimeException("Post save failed", e);
        }
    }

    public Optional<Post> findById(String id) {
        try {
            DocumentSnapshot doc = getDb().collection("posts").document(id).get().get();
            if (doc.exists()) {
                return Optional.ofNullable(doc.toObject(Post.class));
            }
            return Optional.empty();
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    // 特定ユーザーの投稿取得
    public List<Post> findByUserId(String userId) {
        try {
            List<Post> list = new ArrayList<>();
            QuerySnapshot query = getDb().collection("posts")
                    .whereEqualTo("userId", userId)
                    // .orderBy("createdAt", Query.Direction.DESCENDING) // インデックスが必要になる場合があります
                    .get().get();
            
            for (DocumentSnapshot doc : query.getDocuments()) {
                list.add(doc.toObject(Post.class));
            }
            return list;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    // 全件取得
    public List<Post> findAll() {
        try {
            List<Post> list = new ArrayList<>();
            QuerySnapshot query = getDb().collection("posts").get().get();
            for (DocumentSnapshot doc : query.getDocuments()) {
                list.add(doc.toObject(Post.class));
            }
            return list;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
    
    public void deleteById(String id) {
        getDb().collection("posts").document(id).delete();
    }

    // ▼【追加】複数ID検索 (バッチ取得)
    public List<Post> findAllById(List<String> ids) {
        if (ids == null || ids.isEmpty()) return new ArrayList<>();
        
        List<Post> posts = new ArrayList<>();
        // FirestoreのwhereInは最大10件までなので分割して実行
        int batchSize = 10;
        for (int i = 0; i < ids.size(); i += batchSize) {
            List<String> batchIds = ids.subList(i, Math.min(i + batchSize, ids.size()));
            try {
                QuerySnapshot query = getDb().collection("posts")
                        .whereIn(FieldPath.documentId(), batchIds)
                        .get()
                        .get();
                for (DocumentSnapshot doc : query.getDocuments()) {
                    posts.add(doc.toObject(Post.class));
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return posts;
    }
}
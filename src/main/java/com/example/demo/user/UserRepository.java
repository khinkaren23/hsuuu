package com.example.demo.user;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

@Repository
public class UserRepository {

    private Firestore getDb() {
        return FirestoreClient.getFirestore();
    }

    // 保存・更新
    public User save(User user) {
        try {
            if (user.getId() == null) {
                // 新規作成時はIDを自動生成
                user.setId(getDb().collection("users").document().getId());
            }
            getDb().collection("users").document(user.getId()).set(user).get();
            return user;
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Firestore save failed", e);
        }
    }

    // ID検索
    public Optional<User> findById(String id) {
        try {
            DocumentSnapshot doc = getDb().collection("users").document(id).get().get();
            if (doc.exists()) {
                return Optional.ofNullable(doc.toObject(User.class));
            }
            return Optional.empty();
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    // ユーザー名検索
    public Optional<User> findByUsername(String username) {
        try {
            QuerySnapshot query = getDb().collection("users")
                    .whereEqualTo("username", username)
                    .limit(1)
                    .get().get();
            
            if (!query.isEmpty()) {
                return Optional.of(query.getDocuments().get(0).toObject(User.class));
            }
            return Optional.empty();
        } catch (Exception e) {
            return Optional.empty();
        }
    }
    
    // 全件取得
    public List<User> findAll() {
        try {
            List<User> list = new ArrayList<>();
            QuerySnapshot query = getDb().collection("users").get().get();
            for (DocumentSnapshot doc : query.getDocuments()) {
                list.add(doc.toObject(User.class));
            }
            return list;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    // 削除
    public void deleteById(String id) {
        getDb().collection("users").document(id).delete();
    }

    // 複数ID検索 (バッチ取得)
    public List<User> findAllById(List<String> ids) {
        if (ids == null || ids.isEmpty()) return new ArrayList<>();
        
        List<User> users = new ArrayList<>();
        // FirestoreのwhereInは最大10件までなので分割して実行
        int batchSize = 10;
        for (int i = 0; i < ids.size(); i += batchSize) {
            List<String> batchIds = ids.subList(i, Math.min(i + batchSize, ids.size()));
            try {
                QuerySnapshot query = getDb().collection("users")
                        .whereIn(FieldPath.documentId(), batchIds)
                        .get()
                        .get();
                for (DocumentSnapshot doc : query.getDocuments()) {
                    users.add(doc.toObject(User.class));
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return users;
    }
    
    // 検索（部分一致はFirestoreで難しいため、一旦全件取得などで対応するか、完全一致にする）
    public List<User> findByUsernameContaining(String keyword) {
       // 簡易実装: 完全一致のみ、あるいはクライアント側でフィルタリング推奨
       // ここでは空リストを返してエラー回避
       return new ArrayList<>(); 
    }
}
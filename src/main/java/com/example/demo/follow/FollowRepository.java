package com.example.demo.follow;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Repository
public class FollowRepository {

    private static final String COLLECTION_NAME = "follows";

    private Firestore getDb() {
        return FirestoreClient.getFirestore();
    }

    // フォロー保存
    public void save(Follow follow) {
        try {
            if (follow.getId() == null) {
                DocumentReference docRef = getDb().collection(COLLECTION_NAME).document();
                follow.setId(docRef.getId());
                docRef.set(follow).get();
            } else {
                getDb().collection(COLLECTION_NAME).document(follow.getId()).set(follow).get();
            }
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Failed to save follow", e);
        }
    }

    // フォロー解除（削除）
    public void deleteByFollowerAndFollowed(String followerId, String followedId) {
        try {
            // 既存のフォロー関係を探す (limit 1で十分)
            QuerySnapshot query = getDb().collection(COLLECTION_NAME)
                    .whereEqualTo("followerId", followerId)
                    .whereEqualTo("followedId", followedId)
                    .limit(1)
                    .get().get();
            
            for (QueryDocumentSnapshot doc : query.getDocuments()) {
                getDb().collection(COLLECTION_NAME).document(doc.getId()).delete();
            }
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Failed to delete follow", e);
        }
    }

    // すでにフォローしているかチェック
    public boolean existsByFollowerAndFollowed(String followerId, String followedId) {
        try {
            QuerySnapshot query = getDb().collection(COLLECTION_NAME)
                    .whereEqualTo("followerId", followerId)
                    .whereEqualTo("followedId", followedId)
                    .limit(1) // 存在確認だけなので1件で十分
                    .get().get();
            return !query.isEmpty();
        } catch (InterruptedException | ExecutionException e) {
            e.printStackTrace();
            return false;
        }
    }

    // フォロワー一覧を取得（自分がフォローされている）
    public List<Follow> findByFollowedId(String followedId) {
        return queryByField("followedId", followedId);
    }

    // フォロー中一覧を取得（自分がフォローしている）
    public List<Follow> findByFollowerId(String followerId) {
        return queryByField("followerId", followerId);
    }

    private List<Follow> queryByField(String field, String value) {
        List<Follow> list = new ArrayList<>();
        try {
            QuerySnapshot query = getDb().collection(COLLECTION_NAME)
                    .whereEqualTo(field, value)
                    .get().get();
            for (QueryDocumentSnapshot doc : query.getDocuments()) {
                list.add(doc.toObject(Follow.class));
            }
        } catch (InterruptedException | ExecutionException e) {
            e.printStackTrace();
        }
        return list;
    }

    public int countByFollowedId(String followedId) {
        try {
            return getDb().collection(COLLECTION_NAME)
                    .whereEqualTo("followedId", followedId)
                    .get().get()
                    .size();
        } catch (InterruptedException | ExecutionException e) {
            e.printStackTrace();
            return 0;
        }
    }

    public int countByFollowerId(String followerId) {
        try {
            return getDb().collection(COLLECTION_NAME)
                    .whereEqualTo("followerId", followerId)
                    .get().get()
                    .size();
        } catch (InterruptedException | ExecutionException e) {
            e.printStackTrace();
            return 0;
        }
    }
}
package com.example.demo.bookmark;

import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.stream.Collectors;

@Repository
public class BookmarkRepository {

    private Firestore getDb() {
        return FirestoreClient.getFirestore();
    }

    public Bookmark save(Bookmark bookmark) {
        try {
            if (bookmark.getId() == null) {
                bookmark.setId(getDb().collection("bookmarks").document().getId());
            }
            getDb().collection("bookmarks").document(bookmark.getId()).set(bookmark).get();
            return bookmark;
        } catch (Exception e) {
            throw new RuntimeException("Bookmark save failed", e);
        }
    }

    public void delete(String id) {
        getDb().collection("bookmarks").document(id).delete();
    }

    public void deleteByUserIdAndPostId(String userId, String postId) {
        try {
            QuerySnapshot qs = getDb().collection("bookmarks")
                    .whereEqualTo("userId", userId)
                    .whereEqualTo("postId", postId)
                    .get().get();
            
            for (DocumentSnapshot doc : qs.getDocuments()) {
                doc.getReference().delete();
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete bookmark", e);
        }
    }

    public boolean existsByUserIdAndPostId(String userId, String postId) {
        try {
            QuerySnapshot qs = getDb().collection("bookmarks")
                    .whereEqualTo("userId", userId)
                    .whereEqualTo("postId", postId)
                    .limit(1)
                    .get().get();
            return !qs.isEmpty();
        } catch (Exception e) {
            return false;
        }
    }

    public List<Bookmark> findByUserId(String userId) {
        try {
            QuerySnapshot qs = getDb().collection("bookmarks")
                    .whereEqualTo("userId", userId)
                    .get().get();
            return qs.toObjects(Bookmark.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch bookmarks", e);
        }
    }

    // ▼【追加】バッチ取得用: 指定された投稿IDリストのうち、ユーザーがブックマークしている投稿IDのリストを返す
    public List<String> findBookmarkedPostIdsByUserIdAndPostIds(String userId, List<String> postIds) {
        if (postIds == null || postIds.isEmpty()) return java.util.Collections.emptyList();

        List<String> bookmarkedPostIds = new java.util.ArrayList<>();
        int batchSize = 10; // Firestore whereIn limit

        for (int i = 0; i < postIds.size(); i += batchSize) {
            List<String> batchIds = postIds.subList(i, Math.min(i + batchSize, postIds.size()));
            try {
                QuerySnapshot query = getDb().collection("bookmarks")
                        .whereEqualTo("userId", userId)
                        .whereIn("postId", batchIds)
                        .get()
                        .get();
                
                for (DocumentSnapshot doc : query.getDocuments()) {
                    Bookmark bookmark = doc.toObject(Bookmark.class);
                    if (bookmark != null && bookmark.getPostId() != null) {
                        bookmarkedPostIds.add(bookmark.getPostId());
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return bookmarkedPostIds;
    }
}

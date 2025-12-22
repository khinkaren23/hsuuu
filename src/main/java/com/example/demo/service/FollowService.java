package com.example.demo.service;

import com.example.demo.follow.Follow;
import com.example.demo.follow.FollowRepository;
import com.example.demo.user.User;
import com.example.demo.user.UserRepository;
import com.example.demo.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;

    public FollowService(FollowRepository followRepository, UserRepository userRepository) {
        this.followRepository = followRepository;
        this.userRepository = userRepository;
    }

    // フォローする / 解除する (トグル)
    public boolean toggleFollow(String followerId, String followedId) {
        if (followerId.equals(followedId)) {
            throw new IllegalArgumentException("自分自身はフォローできません");
        }
        
        // 相手が存在するか確認
        userRepository.findById(followedId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + followedId));

        if (followRepository.existsByFollowerAndFollowed(followerId, followedId)) {
            // 既にフォロー済みなら解除
            followRepository.deleteByFollowerAndFollowed(followerId, followedId);
            return false; // フォロー解除
        } else {
            // フォロー登録
            Follow follow = new Follow(followerId, followedId, LocalDateTime.now().toString());
            followRepository.save(follow);
            return true; // フォロー中
        }
    }

    // フォロー状態を確認
    public boolean isFollowing(String followerId, String followedId) {
        return followRepository.existsByFollowerAndFollowed(followerId, followedId);
    }

    // フォロワー一覧を取得（ユーザー情報付き）
    public List<User> getFollowers(String userId) {
        List<Follow> follows = followRepository.findByFollowedId(userId);
        if (follows.isEmpty()) return new ArrayList<>();

        List<String> followerIds = new ArrayList<>();
        for (Follow f : follows) {
            followerIds.add(f.getFollowerId());
        }
        
        // N+1問題対策: 一括取得
        return userRepository.findAllById(followerIds);
    }

    // フォロー中一覧を取得（ユーザー情報付き）
    public List<User> getFollowing(String userId) {
        List<Follow> follows = followRepository.findByFollowerId(userId);
        if (follows.isEmpty()) return new ArrayList<>();

        List<String> followingIds = new ArrayList<>();
        for (Follow f : follows) {
            followingIds.add(f.getFollowedId());
        }

        // N+1問題対策: 一括取得
        return userRepository.findAllById(followingIds);
    }

    public int getFollowerCount(String userId) {
        return followRepository.countByFollowedId(userId);
    }

    public int getFollowingCount(String userId) {
        return followRepository.countByFollowerId(userId);
    }
}
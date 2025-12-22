package com.example.demo.service;

import com.example.demo.user.User;
import com.example.demo.user.UserRepository;
import com.example.demo.dto.UserRequestDto;
import com.example.demo.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final FollowService followService;

    public UserService(UserRepository userRepository, FileStorageService fileStorageService, FollowService followService) {
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
        this.followService = followService;
    }

    public User createUser(UserRequestDto userDto) {
        User newUser = new User();
        newUser.setUsername(userDto.getUsername());
        newUser.setCreatedAt(LocalDateTime.now().toString());
        // パスワードはSupabase/Firebase Auth側で管理するため、DBには保存しない方針で進めます
        // 必要であればここでハッシュ化してセットしてください
        
        return userRepository.save(newUser);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        
        // フォロー/フォロワー数をセット
        user.setFollowingCount(followService.getFollowingCount(id));
        user.setFollowerCount(followService.getFollowerCount(id));
        
        return user;
    }

    public void deleteUser(String id) {
        userRepository.deleteById(id);
    }

    public User uploadProfileImage(String userId, MultipartFile file) {
        User user = getUserById(userId);
        String fileName = fileStorageService.storeFile(file);
        user.setProfileImageUrl(fileName);
        return userRepository.save(user);
    }
    
    // 検索（Repositoryの簡易実装に合わせています）
    public List<User> searchUsers(String query) {
        return userRepository.findByUsernameContaining(query);
    }
}
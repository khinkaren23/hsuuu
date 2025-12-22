// ==================================================
// profile.js - Optimized Version
// ==================================================

// ▼▼▼ App.js と同じIDに修正 ▼▼▼
const CURRENT_USER_ID = "1aVxtG72jiGR1SinFNR6"; 
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

// const API_BASE_ROOT = "http://localhost:8080";
// const IMAGE_BASE_URL = "http://localhost:8080/"; // 画像のベースURL
// ▼▼▼ 変更後（環境に合わせて自動取得） ▼▼▼
const API_BASE_ROOT = window.location.origin;
const IMAGE_BASE_URL = window.location.origin + "/";

// URLパラメータから表示対象のユーザーIDを取得
const urlParams = new URLSearchParams(window.location.search);
const TARGET_USER_ID = urlParams.get('userId') || CURRENT_USER_ID;

// ==============================
// ユーティリティ関数
// ==============================

async function fetchWithAuth(url, options = {}) {
    try {
        const res = await fetch(url, options);
        return res;
    } catch (e) {
        console.error("Fetch Error:", e);
        throw e;
    }
}

function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function getImageUrl(path) {
    if (!path || path === "null") return "https://placekitten.com/100/100";
    if (path.startsWith("http")) return path;
    let cleanPath = path.startsWith("/") ? path.substring(1) : path;
    if (!cleanPath.startsWith("uploads/") && !cleanPath.startsWith("img/")) {
        cleanPath = "uploads/" + cleanPath;
    }
    return `${IMAGE_BASE_URL}${cleanPath}`;
}

function formatRelativeTime(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "たった今";
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    if (days < 7) return `${days}日前`;
    
    return date.toLocaleDateString('ja-JP');
}

// ==============================
// 初期化 & データ読み込み
// ==============================

document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    
    // プロフィール情報と投稿一覧を並列で取得して高速化
    Promise.all([loadUserProfile(), loadUserPosts()])
        .catch(err => console.error("Initial load failed:", err));
});

// ==============================
// プロフィール情報読み込み
// ==============================

async function loadUserProfile() {
    try {
        const res = await fetchWithAuth(`${API_BASE_ROOT}/users/${TARGET_USER_ID}`);
        if (res.ok) {
            const user = await res.json();
            renderProfile(user);
        } else {
            console.error("User not found");
            const nameEl = document.getElementById("profileName");
            if(nameEl) nameEl.textContent = "ユーザーが見つかりません";
        }
    } catch (e) {
        console.error(e);
    }
}

function renderProfile(user) {
    const headerName = document.getElementById("headerUserName");
    const avatar = document.getElementById("profileAvatar");
    const name = document.getElementById("profileName");
    const id = document.getElementById("profileId");
    const bio = document.getElementById("profileBio");
    const link = document.getElementById("profileLink");
    const follow = document.getElementById("followCount");
    const follower = document.getElementById("followerCount");

    if(headerName) headerName.textContent = user.username || "No Name";
    if(name) name.textContent = user.username || "No Name";
    if(id) id.textContent = "@" + (user.id || "unknown");
    if(bio) bio.textContent = user.bio || "自己紹介はまだありません。";
    
    if(avatar) {
        avatar.src = getImageUrl(user.profileImageUrl);
    }

    if(link) {
        if (user.website) {
            link.href = user.website;
            link.textContent = user.website.replace(/^https?:\/\//, '');
            link.style.display = "inline";
        } else {
            link.style.display = "none";
        }
    }

    if(follow) follow.textContent = user.followingCount || 0;
    if(follower) follower.textContent = user.followerCount || 0;

    // ▼▼▼ フォローボタンの制御 ▼▼▼
    const followBtn = document.getElementById("followBtn");
    if (followBtn) {
        // 自分自身のプロフィールの場合はボタンを隠す
        if (TARGET_USER_ID === CURRENT_USER_ID) {
            followBtn.style.display = "none";
        } else {
            followBtn.style.display = "block";
            checkFollowStatus(); // フォロー状態を確認
            
            // クリックイベント設定（重複防止のため一旦削除してから追加）
            followBtn.replaceWith(followBtn.cloneNode(true));
            document.getElementById("followBtn").addEventListener("click", handleFollowToggle);
        }
    }
}

// フォロー状態を確認してボタンを更新
async function checkFollowStatus() {
    try {
        const res = await fetchWithAuth(`${API_BASE_ROOT}/api/users/${TARGET_USER_ID}/is-following?followerId=${CURRENT_USER_ID}`);
        if (res.ok) {
            const data = await res.json();
            updateFollowButton(data.following);
        }
    } catch (e) {
        console.error("Follow status check failed", e);
    }
}

// フォローボタンの表示更新
function updateFollowButton(isFollowing) {
    const btn = document.getElementById("followBtn");
    if (!btn) return;

    if (isFollowing) {
        btn.textContent = "フォロー中";
        btn.classList.add("following");
        btn.style.backgroundColor = "transparent";
        btn.style.color = "#333";
        btn.style.border = "1px solid #ccc";
    } else {
        btn.textContent = "フォロー";
        btn.classList.remove("following");
        btn.style.backgroundColor = "#000";
        btn.style.color = "#fff";
        btn.style.border = "none";
    }
}

// フォロー切り替え処理
async function handleFollowToggle() {
    const btn = document.getElementById("followBtn");
    if (!btn) return;
    
    btn.disabled = true; // 連打防止

    try {
        const res = await fetchWithAuth(`${API_BASE_ROOT}/api/users/${TARGET_USER_ID}/follow?followerId=${CURRENT_USER_ID}`, {
            method: "POST"
        });

        if (res.ok) {
            const data = await res.json();
            const isFollowing = data.following;
            updateFollowButton(isFollowing);

            // フォロワー数の表示を更新
            const followerCountEl = document.getElementById("followerCount");
            if (followerCountEl) {
                let count = parseInt(followerCountEl.textContent) || 0;
                if (isFollowing) {
                    count++;
                } else {
                    count = Math.max(0, count - 1);
                }
                followerCountEl.textContent = count;
            }
        } else {
            console.error("Follow toggle failed");
        }
    } catch (e) {
        console.error("Error toggling follow", e);
    } finally {
        btn.disabled = false;
    }
}

// ==============================
// タブ切り替え & データ表示
// ==============================

const tabPosts   = document.getElementById("tab-posts");
const tabReplies = document.getElementById("tab-replies");
const tabImages  = document.getElementById("tab-images");
const contentArea = document.getElementById("profilePosts");

let cachedPosts = null; // 投稿データのキャッシュ

function setupTabs() {
    if(tabPosts) tabPosts.addEventListener("click", () => switchTab("posts"));
    if(tabReplies) tabReplies.addEventListener("click", () => switchTab("replies"));
    if(tabImages) tabImages.addEventListener("click", () => switchTab("images"));
}

async function switchTab(mode) {
    document.querySelectorAll(".profile-tabs span").forEach(t => t.classList.remove("active"));
    if (mode === "posts" && tabPosts) tabPosts.classList.add("active");
    if (mode === "replies" && tabReplies) tabReplies.classList.add("active");
    if (mode === "images" && tabImages) tabImages.classList.add("active");

    // 既にデータがあれば再描画のみ
    if (cachedPosts) {
        renderPosts(cachedPosts, mode);
    } else {
        await loadUserPosts(mode);
    }
}

async function loadUserPosts(mode = "posts") {
    contentArea.innerHTML = '<p style="text-align:center; padding:20px;">読み込み中...</p>';
    try {
        // viewingUserId を渡して、いいね/ブックマーク状態も含めて取得
        const res = await fetchWithAuth(`${API_BASE_ROOT}/users/${TARGET_USER_ID}/posts?viewingUserId=${CURRENT_USER_ID}`);
        if (res.ok) {
            cachedPosts = await res.json();
            // 新しい順にソート
            cachedPosts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            renderPosts(cachedPosts, mode);
        } else {
            contentArea.innerHTML = "<p style='text-align:center;'>投稿の取得に失敗しました</p>";
        }
    } catch (e) {
        console.error(e);
        contentArea.innerHTML = "<p style='text-align:center;'>エラーが発生しました</p>";
    }
}

function renderPosts(posts, mode) {
    contentArea.innerHTML = "";

    let filteredPosts = posts;
    if (mode === "replies") {
        // 返信のみ（repostIdがある、またはcontentが@で始まるなど簡易判定）
        // ここでは簡易的に「全て表示」または「リポストのみ」などのロジックを入れる
        // 今回は全件表示とします（要件に合わせてフィルタリングしてください）
    } else if (mode === "images") {
        filteredPosts = posts.filter(p => p.imageUrls && p.imageUrls.length > 0);
    }

    if (filteredPosts.length === 0) {
        contentArea.innerHTML = "<p style='text-align:center; padding:20px; color:#888;'>表示する投稿がありません</p>";
        return;
    }

    contentArea.innerHTML = filteredPosts.map(post => renderPostHTML(post)).join("");
}

// 投稿HTML生成 (App.jsと共通化推奨)
function renderPostHTML(post) {
    const username = post.user ? post.user.username : "Unknown";
    const avatarUrl = getImageUrl(post.user ? post.user.profileImageUrl : null);
    const timeDisplay = formatRelativeTime(post.createdAt);

    // 画像
    let imagesHtml = "";
    if (post.imageUrls && post.imageUrls.length > 0) {
        imagesHtml = `<div class="post-images">
            ${post.imageUrls.map(url => {
                const fullUrl = getImageUrl(url);
                return `<img src="${fullUrl}" alt="post image" style="max-width:100%; border-radius:12px; margin-top:8px;">`;
            }).join("")}
        </div>`;
    }

    // リポスト
    let repostHtml = "";
    if (post.repostedPost) {
        const rp = post.repostedPost;
        const rpUser = rp.user ? rp.user.username : "Unknown";
        let rpImagesHtml = "";
        if (rp.imageUrls && rp.imageUrls.length > 0) {
            rpImagesHtml = `<div class="post-images" style="margin-top:8px;">
                ${rp.imageUrls.map(url => `<img src="${getImageUrl(url)}" style="max-width:100%; border-radius:10px;">`).join("")}
            </div>`;
        }
        repostHtml = `
        <div class="reposted-content" style="border: 1px solid #ddd; border-radius: 12px; padding: 12px; margin-top: 10px; background-color: #f8f9fa;">
            <div style="font-size: 0.85em; color: #666; margin-bottom: 6px;">
                <i class="fa-solid fa-retweet"></i> <strong>${escapeHtml(rpUser)}</strong> さんの投稿
            </div>
            <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(rp.content)}</p>
            ${rpImagesHtml}
        </div>`;
    }

    const heartClass = post.likedByCurrentUser ? "fa-solid fa-heart" : "fa-regular fa-heart";
    const heartColor = post.likedByCurrentUser ? "#ff4d4d" : "";
    const bookmarkClass = post.bookmarkedByCurrentUser ? "fa-solid fa-bookmark" : "fa-regular fa-bookmark";
    const bookmarkColor = post.bookmarkedByCurrentUser ? "#FFD700" : "";

    return `
    <article class="post" data-id="${post.id}" onclick="window.location.href='post_detail.html?postId=${post.id}'" style="cursor:pointer;">
        <div class="post-header" style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
            <img src="${avatarUrl}" alt="avatar" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">
            <div class="user-info">
                <strong>${escapeHtml(username)}</strong>
                <span style="color:#888; font-size:12px; margin-left:8px;">${timeDisplay}</span>
            </div>
        </div>
        <div class="post-content">
            <p style="white-space: pre-wrap;">${escapeHtml(post.content)}</p>
            ${imagesHtml}
        </div>
        ${repostHtml}
        <div class="post-actions" style="display:flex; gap:20px; margin-top:12px; color:#555;">
            <button onclick="event.stopPropagation()" style="background:none; border:none;"><i class="${heartClass}" style="color:${heartColor}"></i> ${post.likeCount || 0}</button>
            <button onclick="event.stopPropagation()" style="background:none; border:none;"><i class="fa-regular fa-comment"></i> ${post.commentCount || 0}</button>
            <button onclick="event.stopPropagation()" style="background:none; border:none;"><i class="fa-solid fa-retweet"></i></button>
            <button onclick="event.stopPropagation()" style="background:none; border:none;"><i class="${bookmarkClass}" style="color:${bookmarkColor}"></i></button>
        </div>
    </article>
    `;
}
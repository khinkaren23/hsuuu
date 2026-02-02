
// ==================================================
// profile.js - Optimized Version
// ==================================================
import { 
    API_BASE_ROOT, 
    IMAGE_BASE_URL, 
    CURRENT_USER_ID, 
    fetchWithAuth, 
    getImageUrl, 
    renderPostHTML,
    setupCommonEventHandlers,
    appCallbacks,
    injectCommonModals
} from './common.js';

// URLパラメータから表示対象のユーザーIDを取得
const urlParams = new URLSearchParams(window.location.search);
const TARGET_USER_ID = urlParams.get('userId') || CURRENT_USER_ID;

// ==============================
// 初期化 & データ読み込み
// ==============================

document.addEventListener('DOMContentLoaded', () => {
    // 共通セットアップ
    injectCommonModals();
    setupCommonEventHandlers();

    // コールバック登録 (リロード用)
    appCallbacks.onLoadData = () => {
        // 現在のアクティブなタブに合わせてリロード
        const activeTab = document.querySelector(".profile-tabs span.active");
        let mode = "posts";
        if (activeTab) {
            if (activeTab.id === "tab-replies") mode = "replies";
            else if (activeTab.id === "tab-images") mode = "images";
        }
        loadUserPosts(mode);
    };

    setupTabs();
    
    // プロフィール情報と投稿一覧を並列で取得
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
            
            // クリックイベント設定
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
    } else {
        btn.textContent = "フォロー";
        btn.classList.remove("following");
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
    if(!contentArea) return;
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
    if(!contentArea) return;
    contentArea.innerHTML = "";

    let filteredPosts = posts;
    if (mode === "replies") {
        // 簡易ロジック: リポストや@を含むものなど？ 要件次第だが今回は全件
        // 厳密にはAPI側で分けるのがベストだが、既存互換のため
    } else if (mode === "images") {
        filteredPosts = posts.filter(p => p.imageUrls && p.imageUrls.length > 0);
    }

    if (filteredPosts.length === 0) {
        contentArea.innerHTML = "<p style='text-align:center; padding:20px; color:#888;'>表示する投稿がありません</p>";
        return;
    }

    // common.js の renderPostHTML を使用
    contentArea.innerHTML = filteredPosts.map(renderPostHTML).join("");
}

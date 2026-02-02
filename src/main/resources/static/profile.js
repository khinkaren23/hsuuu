// ==================================================
// profile.js - Optimized Version
// ==================================================

// ▼▼▼ App.js と同じIDに修正 ▼▼▼
const CURRENT_USER_ID = "1aVxtG72jiGR1SinFNR6"; 
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

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
const eventHandlers = {
    '.like-btn': handleLike,
    '.comment-btn': handleCommentClick,
    '.repost-btn': handleRepost,
    '.bookmark-btn': handleBookmark,
    '.delete-post-btn': handleDeletePost,
    '.delete-comment-btn': handleDeleteComment
};

document.addEventListener('click', (e) => {
    // 各種ボタンハンドラ
    for (const [selector, handler] of Object.entries(eventHandlers)) {
        const el = e.target.closest(selector);
        if (el) {
            e.preventDefault();
            handler(el);
            return;
        }
    }

    // 投稿クリック（詳細ページへ遷移）
    const postArticle = e.target.closest('.post');
    if (postArticle && !e.target.closest('button') && !e.target.closest('a') && !e.target.closest('.modal')) {
        const postId = postArticle.dataset.id;
        if (postId) {
            window.location.href = `post_detail.html?postId=${postId}`;
        }
    }
});


// ==============================
// データ読み込み & 表示 (Core)
// ==============================

// 投稿一覧を読み込む
async function loadData() {
    console.log("Loading data...");
    const feed = document.getElementById("feed");
    if (!feed) return;

    try {
        const res = await fetchWithAuth(`${API_BASE_ROOT}/posts?viewingUserId=${CURRENT_USER_ID}&t=${Date.now()}`);
        if (res.ok) {
            const posts = await res.json();
            
            if (posts.length === 0) {
                feed.innerHTML = "<p style='text-align:center; padding:20px;'>投稿がありません</p>";
                return;
            }

            // 最新順（降順）にソート
            posts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

            // HTMLを一括生成して表示
            feed.innerHTML = posts.map(renderPostHTML).join("");
        } else {
            console.error("Failed to load posts:", res.status);
            feed.innerHTML = "<p style='text-align:center; padding:20px; color:red;'>データの読み込みに失敗しました</p>";
        }
    } catch (e) {
        console.error(e);
        feed.innerHTML = "<p style='text-align:center; padding:20px; color:gray;'>サーバーに接続できません</p>";
    }
}




function renderPostHTML(post) {
    const username = post.user ? post.user.username : "Unknown";
    const avatarUrl = getImageUrl(post.user ? post.user.profileImageUrl : null);
    const timeDisplay = formatRelativeTime(post.createdAt);
    const isMyPost = post.user && String(post.user.id) === String(CURRENT_USER_ID);

    // 画像処理
    const imagesHtml = post.imageUrls && post.imageUrls.length > 0 
        ? `<div class="post-images">
            ${post.imageUrls.map(url => 
                `<img src="${getImageUrl(url)}" alt="post image">`
            ).join("")}
        </div>`
        : "";

    // リポスト表示処理
    let repostHtml = "";
    if (post.repostedPost) {
        const rp = post.repostedPost;
        const rpUser = rp.user ? rp.user.username : "Unknown";
        const rpImagesHtml = rp.imageUrls && rp.imageUrls.length > 0
            ? `<div class="post-images">
                ${rp.imageUrls.map(url => 
                    `<img src="${getImageUrl(url)}" alt="repost image">`
                ).join("")}
            </div>`
            : "";

        repostHtml = `
        <div class="reposted-content">
            <div style="font-size: 0.85em; color: #666; margin-bottom: 6px;">
                <img src="${escapeHtml(getImageUrl(rp.user ? rp.user.profileImageUrl : null))}" alt="avatar" style="width:30px; height:30px; border-radius:50%; object-fit:cover;">
                <i class="fa-solid fa-retweet"></i> <strong>${escapeHtml(rpUser)}</strong> さんの投稿
            </div>
            <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(rp.content)}</p>
            ${rpImagesHtml}
        </div>`;
    } else if (post.repostId) {
        repostHtml = `<div class="reposted-content">
            <i class="fa-solid fa-triangle-exclamation"></i> 元の投稿は削除されたか、表示できません。
        </div>`;
    }

    const heartIcon = post.likedByCurrentUser ? "fa-solid fa-heart" : "fa-regular fa-heart";
    const heartColor = post.likedByCurrentUser ? "#ff4d4d" : "";
    const bookmarkIcon = post.bookmarkedByCurrentUser ? "fa-solid fa-bookmark" : "fa-regular fa-bookmark";
    const bookmarkColor = post.bookmarkedByCurrentUser ? "#FFD700" : "";
    const deleteBtn = isMyPost 
        ? `<button class="delete-post-btn" data-id="${post.id}"><i class="fa-solid fa-trash"></i></button>`
        : "";

    return `
    <article class="post" data-id="${post.id}">
        <div class="post-header" >
            <img src="${avatarUrl}" alt="avatar" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">
            <div class="user-info">
                <a href="profile.html?userId=${post.user ? post.user.id : ''}">
                    <strong>${escapeHtml(username)}</strong>
                </a>
                <span style="color:#888; font-size:12px; margin-left:8px;">${timeDisplay}</span>
            </div>
        </div>

        <div class="post-content">
            <p style="white-space: pre-wrap;">${escapeHtml(post.content)}</p>
            ${imagesHtml}
        </div>

        ${repostHtml}

        <div class="post-actions">
            <button class="post-action-btn like-btn" data-id="${post.id}" data-type="post">
                <i class="${heartIcon}" style="color: ${heartColor};"></i> ${post.likeCount || 0}
            </button>
            <button class="post-action-btn comment-btn" data-id="${post.id}" data-type="post">
                <i class="fa-regular fa-comment"></i> ${post.commentCount || 0}
            </button>
            <button class="post-action-btn repost-btn" data-id="${post.id}">
                <i class="fa-solid fa-retweet" style="${post.repostedPost ? 'color:#00ba7c;' : ''};"></i>
            </button>
            <button class="post-action-btn bookmark-btn" data-id="${post.id}">
                <i class="${bookmarkIcon}" style="color: ${bookmarkColor};"></i>
            </button>
            ${deleteBtn}
        </div>
    </article>`;
}

// ==============================
// アクション機能
// ==============================

async function handleLike(button) {
    const itemId = button.dataset.id;
    const itemType = button.dataset.type;
    const isPost = itemType === 'post';
    const postData = isPost ? { postId: itemId } : { commentId: itemId };

    try {
        const res = await fetchWithAuth(`${API_BASE_ROOT}/likes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: CURRENT_USER_ID, ...postData })
        });

        if (res.ok) {
            const icon = button.querySelector('i');
            let count = parseInt(button.innerText.trim()) || 0;

            if (res.status === 204) {
                icon.classList.remove('fa-solid');
                icon.classList.add('fa-regular');
                icon.style.color = ''; 
                count = Math.max(0, count - 1);
            } else {
                await res.json(); 
                icon.classList.remove('fa-regular');
                icon.classList.add('fa-solid');
                icon.style.color = '#ff4d4d';
                count += 1;
            }
            button.innerHTML = `<i class="${icon.className}" style="color: ${icon.style.color}"></i> ${count}`;
        }
    } catch (error) {
        console.error('Error handling like:', error);
    }
}

function handleCommentClick(button) {
    const id = button.dataset.id;
    const type = button.dataset.type; 
    
    if (type === "post") {
        openCommentModal(id);
    } else if (type === "comment") {
        // インラインフォームの表示切り替え
        const form = document.getElementById(`reply-form-${id}`);
        if (form) {
            form.style.display = form.style.display === "none" ? "block" : "none";
            if (form.style.display === "block") {
                const input = document.getElementById(`reply-input-${id}`);
                if (input) input.focus();
            }
        }
    }
}

async function handleDeleteComment(button) {
    const commentId = String(button.dataset.id); // dataset.id は文字列化しておく
    if (!confirm("このコメントを削除しますか？")) return;

    // UIを先に更新（楽観的更新）
    // 1. ポストのコメント数を減らす
    if (currentPostIdForModal) {
        const postArticle = document.querySelector(`.post[data-id="${currentPostIdForModal}"]`);
        if (postArticle) {
            const commentBtn = postArticle.querySelector('.comment-btn[data-type="post"]');
            if (commentBtn) {
                const textNode = Array.from(commentBtn.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
                if (textNode) {
                    let count = parseInt(textNode.textContent.trim()) || 0;
                    textNode.textContent = ` ${Math.max(0, count - 1)}`;
                }
            }
        }
    }

    // 2. コメントリストの更新（ここが重要）
    if(currentCommentsData && currentCommentsData.length > 0) {
        // currentCommentsData から該当コメントを削除
        const newData = currentCommentsData.filter(c => String(c.id) !== commentId);
        
        // もし削除対象が子コメントなら、親コメントのデータを探して再計算させる必要があるが
        // renderCommentsList() はデータを元に動的に parentId から replies を構築するので
        // 単純に配列から消すだけで、再描画時に親のカウントも勝手に減る。
        
        currentCommentsData = newData; // 更新
        renderCommentsList(currentCommentsData); // 再描画
    }

    try {
        const res = await fetchWithAuth(`${API_BASE_ROOT}/comments/${commentId}?userId=${CURRENT_USER_ID}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            // サーバー成功時は特に何もしない（画面は既に更新済み）
            // 念のため投稿データだけ非同期で更新しておく（フィードの数値整合性のため）
            // しかし loadData() をここで呼ぶと、フィード全体が再描画され、スクロール位置などが飛ぶ可能性があるので
            // フィードの更新は楽観更新に任せて何もしないのが一番UXが良い。
            console.log("Deleted successfully");
        } else {
            alert("削除に失敗しました");
            // 失敗したらリロードして元に戻す
            if (currentPostIdForModal) {
                loadData();
                loadComments(currentPostIdForModal);
            }
        }
    } catch (e) {
        console.error(e);
        alert("エラーが発生しました");
        if (currentPostIdForModal) {
            loadData();
            loadComments(currentPostIdForModal);
        }
    }
}

// --- ブックマーク機能 ---
async function handleBookmark(button) {
    const postId = button.dataset.id;
    try {
        const res = await fetchWithAuth(`${API_BASE_ROOT}/users/${CURRENT_USER_ID}/bookmarks/${postId}`, {
            method: 'POST'
        });
        if (res.ok) {
            const icon = button.querySelector('i');
            if (icon.classList.contains('fa-regular')) {
                icon.classList.remove('fa-regular');
                icon.classList.add('fa-solid');
                icon.style.color = '#FFD700';
            } else {
                icon.classList.remove('fa-solid');
                icon.classList.add('fa-regular');
                icon.style.color = '';
            }
        }
    } catch (e) {
        console.error("Error bookmarking:", e);
    }
}

// ==============================
// モーダル管理システム
// ==============================
const modalManager = {
    repost: {
        modal: null,
        currentId: null,
        async execute(id) {
            try {
                const res = await fetchWithAuth(`${API_BASE_ROOT}/posts/${id}/repost?userId=${CURRENT_USER_ID}`, {
                    method: "POST"
                });
                if(res.ok) loadData(); 
                else alert("リポストに失敗しました");
            } catch(e) {
                console.error(e);
            }
        }
    },
    delete: {
        modal: null,
        currentId: null,
        async execute(id) {
            try {
                const res = await fetchWithAuth(`${API_BASE_ROOT}/posts/${id}?userId=${CURRENT_USER_ID}`, {
                    method: 'DELETE'
                });
                if (res.ok) loadData();
                else alert("削除に失敗しました");
            } catch (e) {
                console.error(e);
                alert("エラーが発生しました");
            }
        }
    }
};

// モーダルの初期化
function initModals() {
    ['repost', 'delete'].forEach(key => {
        const modalId = key === 'repost' ? 'repostModal' : 'deleteModal';
        const confirmBtnId = key === 'repost' ? 'confirmRepostBtn' : 'confirmDeleteBtn';
        const cancelBtnId = key === 'repost' ? 'cancelRepostBtn' : 'cancelDeleteBtn';
        
        modalManager[key].modal = document.getElementById(modalId);
        const confirmBtn = document.getElementById(confirmBtnId);
        const cancelBtn = document.getElementById(cancelBtnId);
        
        if (confirmBtn) {
            confirmBtn.onclick = async () => {
                if (modalManager[key].currentId) {
                    await modalManager[key].execute(modalManager[key].currentId);
                    modalManager[key].modal.style.display = "none";
                    modalManager[key].currentId = null;
                }
            };
        }
        
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                modalManager[key].modal.style.display = "none";
                modalManager[key].currentId = null;
            };
        }
    });
}

// リポスト処理
function handleRepost(button) {
    const postId = button.dataset.id;
    if (modalManager.repost.modal) {
        modalManager.repost.currentId = postId;
        modalManager.repost.modal.style.display = "flex";
    } else {
        if(!confirm("この投稿をリポストしますか？")) return;
        modalManager.repost.execute(postId);
    }
}

// 投稿削除処理
function handleDeletePost(button) {
    const postId = button.dataset.id;
    if (modalManager.delete.modal) {
        modalManager.delete.currentId = postId;
        modalManager.delete.modal.style.display = "flex";
    } else {
        if(!confirm("削除しますか？")) return;
        modalManager.delete.execute(postId);
    }
}

// ==============================
// コメント送信処理
// ==============================

// インライン返信送信処理（loadComments外で使用するためグローバル定義）
async function submitInlineReply(parentId) {
    console.log("submitInlineReply called with parentId:", parentId);
    const input = document.getElementById(`reply-input-${parentId}`);
    if (!input) {
        console.error("Input element not found");
        return;
    }
    const text = input.value.trim();
    if (!text) {
        alert("メッセージを入力してください");
        return;
    }

    await submitComment(parentId, text, "comment");
    
    // 送信成功後、入力をクリアしてフォームを閉じる
    input.value = "";
    const form = document.getElementById(`reply-form-${parentId}`);
    if(form) form.style.display = "none";
}
// HTMLのonclick属性から呼び出せるようにwindowオブジェクトに登録
window.submitInlineReply = submitInlineReply;

async function submitComment(targetId, text, type) {
    try {
        let url;
        if (type === "comment") {
            url = `${API_BASE_ROOT}/users/${CURRENT_USER_ID}/comments/${targetId}/replies`; 
        } else {
            url = `${API_BASE_ROOT}/users/${CURRENT_USER_ID}/posts/${targetId}/comments`;
        }

        const res = await fetchWithAuth(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: text })
        });

        if(res.ok) {
            // alert("投稿しました！");
            loadData(); // フィード更新
            
            // コメントモーダルが開いている場合はコメントリストを再読み込みして表示を更新
            if (typeof currentPostIdForModal !== 'undefined' && currentPostIdForModal) {
                await loadComments(currentPostIdForModal);
            }
        } else {
            alert("送信に失敗しました。");
        }
    } catch(e) {
        console.error(e);
        alert("エラーが発生しました。");
    }
}

// ==============================
// コメントモーダル関連
// ==============================

const commentModal = document.getElementById("commentModal");
const closeModalBtn = document.getElementById("closeModal");
const sendCommentBtn = document.getElementById("sendComment");
let currentPostIdForModal = null;
let currentCommentsData = [];

async function openCommentModal(postId) {
    if (!commentModal) return;
    currentPostIdForModal = postId;
    commentModal.style.display = "flex"; 
    await loadComments(postId);
}

function renderCommentsList(comments) {
    const listEl = document.getElementById("commentList");
    if (!listEl) return;

    if (!comments || comments.length === 0) {
        listEl.innerHTML = "<p>コメントはありません</p>";
        return;
    }

    const commentMap = new Map();
    comments.forEach(c => {
        if (!commentMap.has(c.id)) commentMap.set(c.id, { ...c, replies: [] });
    });

    const topLevelComments = [];
    comments.forEach(c => {
        if (c.parentId) {
            if (commentMap.has(c.parentId)) {
                commentMap.get(c.parentId).replies.push(c.id);
            }
        } else {
            topLevelComments.push(c.id);
        }
    });

    const sortByDateDesc = (idA, idB) => 
        new Date(commentMap.get(idB).createdAt || 0) - new Date(commentMap.get(idA).createdAt || 0);
    
    topLevelComments.sort(sortByDateDesc);
    commentMap.forEach(comment => {
        if (comment.replies) comment.replies.sort(sortByDateDesc);
    });

    const renderComment = (commentId, level = 0) => {
        const comment = commentMap.get(commentId);
        if (!comment || !comment.user) return "";

        const cUser = comment.user.username || "Unknown";
        const avatarUrl = getImageUrl(comment.user.profileImageUrl);
        const timeDisplay = formatRelativeTime(comment.createdAt);

        const heartIcon = comment.likedByCurrentUser ? "fa-solid fa-heart" : "fa-regular fa-heart";
        const heartColor = comment.likedByCurrentUser ? "#ff4d4d" : "";
        const indent = level > 0 ? `margin-left: ${level * 30}px; border-left: 1px solid #b4b4b4; padding-left: 10px;` : "";
        const replyIcon = level > 0 ? '<i class="fa-solid fa-turn-up"></i>' : '';
        const isMyComment = String(comment.user.id) === String(CURRENT_USER_ID);
        const deleteBtn = isMyComment 
            ? `<button class="delete-comment-btn" data-id="${comment.id}"><i class="fa-solid fa-trash"></i></button>`
            : '';

        let html =`
        <div class="comment-item" style="${indent}">
            <div style="font-size: 0.85em; color: #555; display: flex; align-items: center; gap: 8px; margin: 8px 0 8px 15px">
                ${replyIcon}
                <img src="${avatarUrl}" alt="avatar" style="width:24px; height:24px; border-radius:50%; object-fit:cover;">
                <strong>${escapeHtml(cUser)}</strong>
                <span style="color:#999; font-size:0.9em;">${timeDisplay}</span>
            </div>
            <p style="margin: 4px 0 1rem 3rem; white-space: pre-wrap; text-align: left;">${escapeHtml(comment.content)}</p>
            <div class="comment-actions">
                <button class="post-action-btn like-btn" data-id="${comment.id}" data-type="comment">
                    <i class="${heartIcon}" style="color: ${heartColor}; font-size: 1.2em;"></i> ${comment.likeCount || 0}
                </button>
                <button class="post-action-btn comment-btn" data-id="${comment.id}" data-type="comment">
                    <i class="fa-regular fa-comment"></i> ${comment.replies ? comment.replies.length : 0}
                </button>
                ${deleteBtn}
            </div>
            
            <!-- インライン返信フォーム -->
            <div id="reply-form-${comment.id}" style="display:none; margin-top:8px; margin-left:32px;">
                <div style="display:flex; gap:8px;">
                    <input type="text" id="reply-input-${comment.id}" placeholder="返信を入力..." style="flex:1; padding:8px; border:1px solid #ddd; border-radius:12px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                    <button onclick="submitInlineReply('${comment.id}')" style="padding:6px 12px; background-color:#ff7b00; color:white; border:none; border-radius:12px; cursor:pointer;">送信</button>
                </div>
            </div>
        </div>`;

        if (comment.replies) {
            comment.replies.forEach(replyId => {
                html += renderComment(replyId, level + 1);
            });
        }
        return html;
    };

    listEl.innerHTML = topLevelComments.map(id => renderComment(id)).join("");
}

async function loadComments(postId) {
    const listEl = document.getElementById("commentList");
    if (!listEl) return;
    listEl.innerHTML = "<p>読み込み中...</p>";

    try {
        const res = await fetchWithAuth(`${API_BASE_ROOT}/posts/${postId}/comments?viewingUserId=${CURRENT_USER_ID}&t=${Date.now()}`);
        if (res.ok) {
            const comments = await res.json();
            // グローバル変数に保存して描画
            currentCommentsData = comments;
            renderCommentsList(currentCommentsData);
        } else {
            listEl.innerHTML = "<p>コメントの読み込みに失敗しました</p>";
        }
    } catch (e) {
        console.error(e);
        listEl.innerHTML = "<p>エラーが発生しました</p>";
    }
}

if (closeModalBtn) {
    closeModalBtn.onclick = () => {
        if (commentModal) commentModal.style.display = "none";
        currentPostIdForModal = null;
    };
}

if (sendCommentBtn) {
    sendCommentBtn.onclick = () => {
        const textEl = document.getElementById("commentText");
        const text = textEl ? textEl.value : "";
        if (text && currentPostIdForModal) {
            submitComment(currentPostIdForModal, text, "post");
            if (textEl) textEl.value = "";
        }
    };
}

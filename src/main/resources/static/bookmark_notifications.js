// ==========================================
// 保存済みリスト (安定化 & 最適化)
// ==========================================

// const API_BASE_ROOT = "http://localhost:8080";
// const IMAGE_BASE_URL = "http://localhost:8080/"; // 画像のベースURL
// ▼▼▼ 変更後（環境に合わせて自動取得） ▼▼▼
const API_BASE_URL = window.location.origin;
const IMAGE_BASE_URL = window.location.origin + "/";
const CURRENT_USER_ID = "1aVxtG72jiGR1SinFNR6"; // App.jsと統一

function getImageUrl(path) {
    if (!path || path === "null") return "https://placekitten.com/50/50";
    if (path.startsWith("http")) return path;
    let cleanPath = path.startsWith("/") ? path.substring(1) : path;
    if (!cleanPath.startsWith("uploads/") && !cleanPath.startsWith("img/")) {
        cleanPath = "uploads/" + cleanPath;
    }
    return `${IMAGE_BASE_URL}${cleanPath}`;
}

function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

async function loadBookmarks() {
  try {
    // BookmarkControllerのエンドポイントを使用
    const response = await fetch(`${API_BASE_URL}/users/${CURRENT_USER_ID}/bookmarks`, {
      credentials: "include"
    });
    
    if (!response.ok && response.status !== 404) throw new Error("Network response was not ok, status: " + response.status);

    const list = await response.json();

    const container = document.getElementById("bookmarkList");
    if (!container) return;
    container.innerHTML = "";

    if (list.length === 0) {
        container.innerHTML = "<p style='text-align:center; padding:20px;'>保存済みの投稿はありません</p>";
        return;
    }

    // HTMLを一括生成して表示
    container.innerHTML = list.map(renderPostHTML).join("");

  } catch (error) {
    console.error("データ取得失敗:", error);
    const container = document.getElementById("bookmarkList");
    if(container) container.innerHTML = "<p style='text-align:center;'>読み込みエラー</p>";
  }
}

// 投稿1つ分のHTMLを生成する関数 (App.jsから移植)
function renderPostHTML(post) {
    const username = post.user ? post.user.username : "Unknown";
    const avatarUrl = getImageUrl(post.user ? post.user.profileImageUrl : null);
    const timeDisplay = formatRelativeTime(post.createdAt);

    // 画像処理
    let imagesHtml = "";
    if (post.imageUrls && post.imageUrls.length > 0) {
        imagesHtml = `<div class="post-images">
            ${post.imageUrls.map(url => {
                const fullUrl = getImageUrl(url);
                return `<img src="${fullUrl}" alt="post image" style="max-width:100%; border-radius:12px; margin-top:8px;">`;
            }).join("")}
        </div>`;
    }

    // リポスト表示処理
    let repostHtml = "";
    if (post.repostedPost) {
        const rp = post.repostedPost;
        const rpUser = rp.user ? rp.user.username : "Unknown";
        
        let rpImagesHtml = "";
        if (rp.imageUrls && rp.imageUrls.length > 0) {
            rpImagesHtml = `<div class="post-images" style="margin-top:8px;">
                ${rp.imageUrls.map(url => {
                    const fullUrl = getImageUrl(url);
                    return `<img src="${fullUrl}" alt="repost image" style="max-width:100%; border-radius:10px;">`;
                }).join("")}
            </div>`;
        }

        repostHtml = `
        <div class="reposted-content" style="border: 1px solid #ddd; border-radius: 12px; padding: 12px; margin-top: 10px; background-color: #f8f9fa;">
            <div style="font-size: 0.85em; color: #666; margin-bottom: 6px;">
                <i class="fa-solid fa-retweet"></i> <strong>${escapeHtml(rpUser)}</strong> さんの投稿
            </div>
            <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(rp.content)}</p>
            ${rpImagesHtml}
        </div>
        `;
    } else if (post.repostId) {
        repostHtml = `
        <div class="reposted-content" style="border: 1px solid #ddd; border-radius: 12px; padding: 12px; margin-top: 10px; background-color: #f8f9fa; color: #888;">
            <i class="fa-solid fa-triangle-exclamation"></i> 元の投稿は削除されたか、表示できません。
        </div>
        `;
    }

    const heartClass = post.likedByCurrentUser ? "fa-solid fa-heart" : "fa-regular fa-heart";
    const heartColor = post.likedByCurrentUser ? "#ff4d4d" : "";
    const bookmarkClass = post.bookmarkedByCurrentUser ? "fa-solid fa-bookmark" : "fa-regular fa-bookmark";
    const bookmarkColor = post.bookmarkedByCurrentUser ? "#FFD700" : "";

    return `
    <article class="post" data-id="${post.id}" style="border-bottom: 1px solid #eee; padding: 12px; cursor: pointer;">
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
            
            <button class="like-btn" data-id="${post.id}" style="background:none; border:none; cursor:pointer;">
                <i class="${heartClass}" style="color: ${heartColor}"></i> ${post.likeCount || 0}
            </button>

            <button class="comment-btn" data-id="${post.id}" style="background:none; border:none; cursor:pointer;">
                <i class="fa-regular fa-comment"></i> ${post.commentCount || 0}
            </button>

            <button class="repost-btn" data-id="${post.id}" style="background:none; border:none; cursor:pointer;">
                <i class="fa-solid fa-retweet" style="${post.repostedPost ? 'color:#00ba7c;' : ''}"></i>
            </button>

            <button class="bookmark-btn" data-id="${post.id}" style="background:none; border:none; cursor:pointer;">
                <i class="${bookmarkClass}" style="color: ${bookmarkColor}"></i>
            </button>
            
        </div>
    </article>
    `;
}

// 相対時間フォーマット関数
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

// イベント委譲
document.addEventListener('click', (e) => {
    // 投稿クリック（詳細ページへ遷移）
    const postArticle = e.target.closest('.post');
    // ボタン、リンク、モーダル内のクリックは除外
    if (postArticle && !e.target.closest('button') && !e.target.closest('a') && !e.target.closest('.modal')) {
        const postId = postArticle.dataset.id;
        if (postId) {
            window.location.href = `post_detail.html?postId=${postId}`;
        }
    }
});

document.addEventListener('DOMContentLoaded', loadBookmarks);
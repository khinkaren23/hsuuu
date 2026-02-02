// ==========================================
// コメント通知 (安定化 & 最適化)
// ==========================================

// ▼▼▼ 変更後（環境に合わせて自動取得） ▼▼▼
const API_BASE_URL = window.location.origin;
const IMAGE_BASE_URL = window.location.origin + "/";
const CURRENT_USER_ID = "1aVxtG72jiGR1SinFNR6"; // App.jsと統一

// 画像パスを綺麗にする関数（強化版）
function getImageUrl(path) {
    // null, undefined, 文字列の"null", "/null" をすべて弾く
    if (!path || path === "null" || path === "/null") {
        return "https://placekitten.com/50/50"; // デフォルト画像
    }
    
    // すでにhttpがついている場合はそのまま返す
    if (path.startsWith("http")) return path;
    
    // 先頭のスラッシュを削除
    let cleanPath = path.startsWith("/") ? path.substring(1) : path;

    // 念のため整形後も "null" になっていないか再確認
    if (cleanPath === "null") {
        return "https://placekitten.com/50/50";
    }

    // uploads/ や img/ がない場合に補完
    if (!cleanPath.startsWith("uploads/") && !cleanPath.startsWith("img/")) {
        cleanPath = "uploads/" + cleanPath;
    }

    return `${IMAGE_BASE_URL}${cleanPath}`;
}

function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

// ==============================
// イベント委譲 (Event Delegation)
// ==============================
document.addEventListener('click', (e) => {
    // いいねボタン
    const likeBtn = e.target.closest('.like-btn');
    if (likeBtn) {
        e.preventDefault();
        handleLike(likeBtn);
        return;
    }

    // コメントボタン
    const commentBtn = e.target.closest('.comment-btn');
    if (commentBtn) {
        e.preventDefault();
        handleCommentClick(commentBtn);
        return;
    }

    // リポストボタン
    const repostBtn = e.target.closest('.repost-btn');
    if (repostBtn) {
        e.preventDefault();
        handleRepost(repostBtn);
        return;
    }

    // ブックマークボタン
    const bookmarkBtn = e.target.closest('.bookmark-btn');
    if (bookmarkBtn) {
        e.preventDefault();
        handleBookmark(bookmarkBtn);
        return;
    }

    // 投稿削除ボタン
    const deletePostBtn = e.target.closest('.delete-post-btn');
    if (deletePostBtn) {
        e.preventDefault();
        handleDeletePost(deletePostBtn);
        return;
    }

    // コメント削除ボタン
    const deleteCommentBtn = e.target.closest('.delete-comment-btn');
    if (deleteCommentBtn) {
        e.preventDefault();
        handleDeleteComment(deleteCommentBtn);
        return;
    }

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

async function loadCommentNotifications() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/comments?userId=${CURRENT_USER_ID}`, {
      credentials: "include"
    });
    
    if (!response.ok) throw new Error("Network response was not ok");

    const list = await response.json();
    const container = document.getElementById("commentList");
    if (!container) return;
    container.innerHTML = "";

    if (list.length === 0) {
        container.innerHTML = "<p style='text-align:center; padding:20px;'>通知はありません</p>";
        return;
    }

    list.forEach(item => {
      const el = document.createElement("div");
      el.classList.add("notification-card");
      el.style.cursor = "pointer";
      el.dataset.postId = item.postId; // postIDを保持

      const avatarUrl = getImageUrl(item.fromUserAvatar);
      const name = escapeHtml(item.fromUserName);
      const commentText = escapeHtml(item.commentText);
      const time = formatRelativeTime(item.createdAt);
      // const replyTo = escapeHtml(item.replyToUser || "Unknown"); // 未使用

      el.innerHTML = `
      <img src="${avatarUrl}" class="avatar">
      <div class="notify-content">
        <div class="notify-header">
          <span class="name">${name}</span>
          <span class="time" style="margin-left:8px; color:#999; font-size:0.85em;">${time}</span>
        </div>
        <div class="text">${commentText}</div>
      </div>
    `;

      el.addEventListener("click", () => {
        const postId = el.dataset.postId;
        if (postId) {
          window.location.href = `post_detail.html?postId=${encodeURIComponent(postId)}`;
        } else {
          console.warn("postId が含まれていません", item);
        }
      });

      container.appendChild(el);
    });
  } catch (error) {
    console.error("データ取得失敗:", error);
    const container = document.getElementById("commentList");
    if(container) container.innerHTML = "<p style='text-align:center;'>読み込みエラー</p>";
  }
}



document.addEventListener('DOMContentLoaded', loadCommentNotifications);
// ==========================================
// フォロワー一覧 (安定化 & 最適化)
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

async function loadFollowers() {
  try {
    // FollowControllerのエンドポイントを使用
    const response = await fetch(`${API_BASE_URL}/api/users/${CURRENT_USER_ID}/followers-list`, {
      credentials: "include"
    });
    
    if (!response.ok) throw new Error("Network response was not ok, status: " + response.status);

    const list = await response.json();

    const container = document.getElementById("list");
    if (!container) return;
    container.innerHTML = "";

    if (list.length === 0) {
        container.innerHTML = "<p style='text-align:center; padding:20px;'>フォロワーはいません</p>";
        return;
    }

    list.forEach(user => {
      const item = document.createElement("div");
      item.classList.add("notification-card");
      // クリックでプロフィールへ
      item.style.cursor = "pointer";
      item.onclick = () => window.location.href = `profile.html?userId=${user.id}`;

      const avatarUrl = getImageUrl(user.profileImageUrl);
      const name = escapeHtml(user.username || "No Name");
      const bio = escapeHtml(user.bio || "");

      item.innerHTML = `
        <img src="${avatarUrl}" class="avatar" alt="${name}">
        <div class="notify-content">
          <span class="name">${name}</span>
          <span class="text" style="color: #666; font-size: 0.9em;">${bio}</span>
        </div>
      `;
      container.appendChild(item);
    });

  } catch (error) {
    console.error("データ取得失敗:", error);
    const container = document.getElementById("list");
    if(container) container.innerHTML = "<p style='text-align:center;'>読み込みエラー</p>";
  }
}

document.addEventListener('DOMContentLoaded', loadFollowers);
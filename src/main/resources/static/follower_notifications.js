// ==========================================
// フォロワー一覧 (安定化 & 最適化)
// ==========================================

import { 
    API_BASE_URL, 
    IMAGE_BASE_URL, 
    CURRENT_USER_ID, 
    getImageUrl, 
    escapeHtml, 
    fetchWithAuth
} from './common.js';


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
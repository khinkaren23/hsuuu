// ==========================================
// いいね通知 (安定化 & 最適化)
// ==========================================

import { 
    API_BASE_URL, 
    IMAGE_BASE_URL, 
    CURRENT_USER_ID, 
    getImageUrl, 
    escapeHtml, 
    formatRelativeTime,
    fetchWithAuth
} from './common.js';





async function loadLikeNotifications() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/likes?userId=${CURRENT_USER_ID}`, {
      credentials: "include"
    });
    
    if (!response.ok) throw new Error("Network response was not ok");

    const list = await response.json();
    const container = document.getElementById("list");
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
      el.dataset.postId = item.postId;

      const avatarUrl = getImageUrl(item.fromUserAvatar);
      const name = escapeHtml(item.fromUserName);
      const time = formatRelativeTime(item.createdAt);

      el.innerHTML = `
        <img src="${avatarUrl}" class="avatar">
        <div class="notify-content">
          <div class="notify-header">
            <span class="name">${name}</span>
            <span class="time">${time}</span>
          </div>
          <div class="text">あなたの投稿をいいねしました 👍</div>
        </div>
      `;

      el.addEventListener("click", () => {
        const postId = el.dataset.postId;
        if (postId) {
          window.location.href = `post_detail.html?postId=${encodeURIComponent(postId)}`;
        }
      });

      container.appendChild(el);
    });

  } catch (error) {
    console.error("データ取得失敗:", error);
    const container = document.getElementById("list");
    if(container) container.innerHTML = "<p style='text-align:center;'>読み込みエラー</p>";
  }
}

document.addEventListener('DOMContentLoaded', loadLikeNotifications);
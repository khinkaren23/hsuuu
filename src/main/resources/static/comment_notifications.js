// ==========================================
// コメント通知 (安定化 & 最適化)
// ==========================================

import { 
    API_BASE_URL, 
    CURRENT_USER_ID, 
    getImageUrl, 
    escapeHtml, 
    formatRelativeTime,
    fetchWithAuth
} from './common.js';

async function loadCommentNotifications() {
  const container = document.getElementById("commentList");
  if (!container) return;

  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/notifications/comments?userId=${CURRENT_USER_ID}`);
    
    if (!response.ok) throw new Error("Network response was not ok");

    const list = await response.json();
    container.innerHTML = "";

    if (!list || list.length === 0) {
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
      const commentText = escapeHtml(item.commentText);
      const time = formatRelativeTime(item.createdAt);

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
    container.innerHTML = "<p style='text-align:center;'>読み込みエラー</p>";
  }
}

document.addEventListener('DOMContentLoaded', loadCommentNotifications);

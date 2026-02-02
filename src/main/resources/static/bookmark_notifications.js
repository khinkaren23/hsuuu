// ==================================================
// bookmark_notifications.js (Refactored)
// ==================================================

import { 
    API_BASE_URL, 
    CURRENT_USER_ID, 
    fetchWithAuth, 
    renderPostHTML, 
    injectCommonModals, 
    setupCommonEventHandlers,
    appCallbacks
} from './common.js';

// データ更新時のコールバックを設定
appCallbacks.onLoadData = () => {
    loadBookmarks(); // リストを再読み込み
};

async function loadBookmarks() {
    const container = document.getElementById('bookmarkList');
    if (!container) return;
    
    container.innerHTML = '<p style="text-align:center; padding:20px;">読み込み中...</p>';

    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/users/${CURRENT_USER_ID}/bookmarks`);
        
        if (!response.ok) {
             if (response.status === 404) {
                 container.innerHTML = '<p style="text-align:center; padding:20px;">保存済みの投稿はありません</p>';
                 return;
             }
             throw new Error('Network response was not ok');
        }

        const list = await response.json();
        container.innerHTML = '';

        if (!list || list.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:20px;">保存済みの投稿はありません</p>';
            return;
        }

        // 表示 (renderPostHTMLはcommon.jsからインポート)
        container.innerHTML = list.map(renderPostHTML).join('');

    } catch (error) {
        console.error('データ取得失敗:', error);
        container.innerHTML = '<p style="text-align:center;">読み込みエラー</p>';
    }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    injectCommonModals();
    setupCommonEventHandlers();
    loadBookmarks();
});

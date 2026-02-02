// ==================================================
// post_detail.js (Refactored)
// ==================================================

import { 
    API_BASE_URL, 
    CURRENT_USER_ID, 
    fetchWithAuth, 
    renderPostHTML, 
    injectCommonModals,
    setupCommonEventHandlers,
    loadComments,
    submitComment,
    appCallbacks
} from './common.js';

// URLパラメータからpostIdを取得
const urlParams = new URLSearchParams(window.location.search);
const POST_ID = urlParams.get('postId');

if (!POST_ID) {
    alert("投稿IDが指定されていません");
    window.location.href = 'index.html';
}

// データ更新時のコールバックを設定 (common.jsのロジックから呼ばれる)
appCallbacks.onLoadData = () => {
    loadPostDetail(); // 投稿内容とコメントをリロード
};

// ==============================
// ページ固有のデータ読み込み
// ==============================

async function loadPostDetail() {
    const contentEl = document.getElementById("post-content");
    if (!contentEl) return;

    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/posts/${POST_ID}?viewingUserId=${CURRENT_USER_ID}`);
        
        if (res.ok) {
            const post = await res.json();
            // 共通のHTML生成関数を使用
            contentEl.innerHTML = renderPostHTML(post);
            
            // コメント読み込み (common.jsの関数を使用)
            // post_detail.htmlには <div id="commentList"></div> がある前提
            loadComments(POST_ID);
        } else {
            console.error("Failed to load post:", res.status);
            contentEl.innerHTML = "<p style='text-align:center; padding:20px; color:red;'>投稿が見つかりません</p>";
        }
    } catch (e) {
        console.error(e);
        contentEl.innerHTML = "<p style='text-align:center; padding:20px; color:gray;'>サーバーに接続できません</p>";
    }
}

// ==============================
// 初期化 & イベントリスナー
// ==============================

document.addEventListener('DOMContentLoaded', () => {
    // 共通モーダルとイベントハンドラのセットアップ
    injectCommonModals();
    setupCommonEventHandlers();

    // データの読み込み
    loadPostDetail();

    // 詳細ページ独自のコメント送信ボタン (もしページ内にフォームがある場合)
    const submitCommentBtn = document.getElementById("submitCommentBtn");
    if (submitCommentBtn) {
        submitCommentBtn.addEventListener("click", async () => {
            const textEl = document.getElementById("commentText");
            if (!textEl) return;
            
            const text = textEl.value.trim();
            if (text) {
                // common.jsのsubmitCommentを使用
                await submitComment(POST_ID, text, "post");
                textEl.value = "";
            } else {
                alert("コメントを入力してください");
            }
        });
    }
});

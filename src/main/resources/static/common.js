
// ==========================================
// common.js - 全ページ共通の定数・関数・ロジック
// ==========================================

export const CURRENT_USER_ID = "1aVxtG72jiGR1SinFNR6"; // 開発用ダミーID
export const API_BASE_URL = window.location.origin;
export const IMAGE_BASE_URL = window.location.origin + "/";
export const API_BASE_ROOT = window.location.origin; // Alias for compatibility

// ==============================
// ユーティリティ関数
// ==============================

export function getImageUrl(path) {
    if (!path || path === "null" || path === "/null") {
        return "https://placekitten.com/50/50";
    }
    if (path.startsWith("http")) return path;
    let cleanPath = path.startsWith("/") ? path.substring(1) : path;
    if (cleanPath === "null") return "https://placekitten.com/50/50";
    if (!cleanPath.startsWith("uploads/") && !cleanPath.startsWith("img/")) {
        cleanPath = "uploads/" + cleanPath;
    }

    return `${IMAGE_BASE_URL}${cleanPath}`;
}

export function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

export function formatRelativeTime(dateString) {
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

export async function fetchWithAuth(url, options = {}) {
    options.credentials = 'include';
    try {
        const res = await fetch(url, options);
        return res;
    } catch (e) {
        console.error("Fetch Error:", e);
        throw e;
    }
}

// ==============================
// モーダルHTML注入
// ==============================

const COMMON_MODALS_HTML = `
<!-- コメントモーダル -->
<div id="commentModal" class="modal" style="display:none;">
    <div class="modal-content">
        <span class="close" id="closeModal">&times;</span>
        <h2>コメント</h2>
        <div id="commentList"></div> <!-- コメント一覧 -->
        <div class="comment-input-area">
            <textarea id="commentInput" placeholder="コメントを入力..."></textarea>
            <button id="sendComment">送信</button>
        </div>
    </div>
</div>

<!-- リポスト確認モーダル -->
<div id="repostModal" class="modal" style="display:none; justify-content:center; align-items:center;">
    <div class="modal-content" style="max-width:300px; text-align:center;">
        <h3>リポストしますか？</h3>
        <p>この投稿をあなたのフォロワーに共有します。</p>
        <div style="margin-top:20px; display:flex; justify-content:space-around;">
            <button id="cancelRepostBtn" style="background:#ccc;">キャンセル</button>
            <button id="confirmRepostBtn" style="background:#00ba7c; color:white;">リポスト</button>
        </div>
    </div>
</div>

<!-- 削除確認モーダル -->
<div id="deleteModal" class="modal" style="display:none; justify-content:center; align-items:center;">
    <div class="modal-content" style="max-width:300px; text-align:center;">
        <h3>投稿を削除しますか？</h3>
        <p>この操作は取り消せません。</p>
        <div style="margin-top:20px; display:flex; justify-content:space-around;">
            <button id="cancelDeleteBtn" style="background:#ccc;">キャンセル</button>
            <button id="confirmDeleteBtn" style="background:#ff4d4d; color:white;">削除</button>
        </div>
    </div>
</div>
`;

/**
 * ページに共通モーダルHTMLが存在しない場合注入する
 */
export function injectCommonModals() {
    if (!document.getElementById('repostModal')) {
        const div = document.createElement('div');
        div.innerHTML = COMMON_MODALS_HTML;
        document.body.appendChild(div);
    }
}

// ==============================
// 投稿レンダリング (共通)
// ==============================

export function renderPostHTML(post) {
    const username = post.user ? post.user.username : "Unknown";
    const avatarUrl = getImageUrl(post.user ? post.user.profileImageUrl : null);
    const timeDisplay = formatRelativeTime(post.createdAt);
    const isMyPost = post.user && String(post.user.id) === String(CURRENT_USER_ID);

    // 画像
    const imagesHtml = post.imageUrls && post.imageUrls.length > 0 
        ? `<div class="post-images">
            ${post.imageUrls.map(url => 
                `<img src="${getImageUrl(url)}" alt="post image">`
            ).join("")}
        </div>`
        : "";

    // リポスト表示
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

    // data-id属性はイベント委譲で使用
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
// アクション処理ハンドラ
// ==============================

export async function handleLike(button) {
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

export async function handleBookmark(button) {
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

// 外部からコールバックを設定できるようにする（画面リロード用など）
export const appCallbacks = {
    onLoadData: () => { console.log("Default onLoadData"); } // オーバーライドして使う
};

export const modalManager = {
    repost: {
        modal: null,
        currentId: null,
        async execute(id) {
            try {
                const res = await fetchWithAuth(`${API_BASE_ROOT}/posts/${id}/repost?userId=${CURRENT_USER_ID}`, {
                    method: "POST"
                });
                if(res.ok) {
                    if(appCallbacks.onLoadData) appCallbacks.onLoadData(); 
                } else alert("リポストに失敗しました");
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
                if (res.ok) {
                     if(appCallbacks.onLoadData) appCallbacks.onLoadData();
                } else alert("削除に失敗しました");
            } catch (e) {
                console.error(e);
                alert("エラーが発生しました");
            }
        }
    }
};

export function initModals() {
    // 注入
    injectCommonModals();

    // Repost & Delete Modals
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
                    if(modalManager[key].modal) modalManager[key].modal.style.display = "none";
                    modalManager[key].currentId = null;
                }
            };
        }
        
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                if(modalManager[key].modal) modalManager[key].modal.style.display = "none";
                modalManager[key].currentId = null;
            };
        }
    });

    // Comment Modal
    const commentModal = document.getElementById("commentModal");
    const closeModalBtn = document.getElementById("closeModal");
    const sendCommentBtn = document.getElementById("sendComment");
    const commentInput = document.getElementById("commentInput");

    if (closeModalBtn) {
        closeModalBtn.onclick = () => {
            if (commentModal) commentModal.style.display = "none";
            currentPostIdForModal = null;
        };
    }

    if (sendCommentBtn && commentInput) {
        sendCommentBtn.onclick = async () => {
            const text = commentInput.value.trim();
            if(!text) return;
            if(currentPostIdForModal) {
                 await submitComment(currentPostIdForModal, text, "post");
                 commentInput.value = "";
            }
        };
    }

    // Window click to close modals
    window.onclick = (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = "none";
        }
    };
}

export function handleRepost(button) {
    const postId = button.dataset.id;
    if (modalManager.repost.modal) {
        modalManager.repost.currentId = postId;
        modalManager.repost.modal.style.display = "flex";
    } else {
        if(!confirm("この投稿をリポストしますか？")) return;
        modalManager.repost.execute(postId);
    }
}

export function handleDeletePost(button) {
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
// コメント関連ロジック
// ==============================

let currentPostIdForModal = null;
let currentCommentsData = [];

export async function openCommentModal(postId) {
    const commentModal = document.getElementById("commentModal");
    if (!commentModal) return;
    currentPostIdForModal = postId;
    commentModal.style.display = "flex"; 
    await loadComments(postId);
}

export async function loadComments(postId) {
    const listEl = document.getElementById("commentList");
    if (!listEl) return;
    listEl.innerHTML = "<p>読み込み中...</p>";

    try {
        const res = await fetchWithAuth(`${API_BASE_ROOT}/posts/${postId}/comments?viewingUserId=${CURRENT_USER_ID}&t=${Date.now()}`);
        if (res.ok) {
            const comments = await res.json();
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

export function handleCommentClick(button) {
    const id = button.dataset.id;
    const type = button.dataset.type; 
    
    if (type === "post") {
        openCommentModal(id);
    } else if (type === "comment") {
        // インラインフォーム
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

export async function submitComment(targetId, text, type) {
    try {
        let url;
        if (type === "comment") { // reply
            url = `${API_BASE_ROOT}/users/${CURRENT_USER_ID}/comments/${targetId}/replies`; 
        } else { // post
            url = `${API_BASE_ROOT}/users/${CURRENT_USER_ID}/posts/${targetId}/comments`;
        }

        const res = await fetchWithAuth(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: text })
        });

        if(res.ok) {
            if(appCallbacks.onLoadData) appCallbacks.onLoadData(); 
            
            // モーダル更新（投稿へのコメントの場合）
            if (currentPostIdForModal && type === 'post') {
                await loadComments(currentPostIdForModal);
            }
             // inline reply の場合は、別途呼び出し元で再描画が望ましいが
             // 簡易的にモーダル全体を再読み込みする
             if (currentPostIdForModal) {
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

// Global scope for onclick attribute in inline forms
export async function submitInlineReply(parentId) {
    const input = document.getElementById(`reply-input-${parentId}`);
    if (!input) return;
    const text = input.value.trim();
    if (!text) {
        alert("メッセージを入力してください");
        return;
    }

    // common.js 内部の submitComment を呼ぶ
    await submitComment(parentId, text, "comment");
    
    input.value = "";
    const form = document.getElementById(`reply-form-${parentId}`);
    if(form) form.style.display = "none";
}

// Window オブジェクトに登録しないと onclick="submitInlineReply(...)" が動かない
window.submitInlineReply = submitInlineReply;


export async function handleDeleteComment(button) {
    const commentId = String(button.dataset.id); 
    if (!confirm("このコメントを削除しますか？")) return;

    // 楽観更新 (UI)
    // モーダル内のコメント数を減らす処理は省略するが、リストからは即消す
    if(currentCommentsData && currentCommentsData.length > 0) {
        const newData = currentCommentsData.filter(c => String(c.id) !== commentId);
        currentCommentsData = newData; 
        renderCommentsList(currentCommentsData); 
    }

    try {
        const res = await fetchWithAuth(`${API_BASE_ROOT}/comments/${commentId}?userId=${CURRENT_USER_ID}`, {
            method: 'DELETE'
        });
        if (res.ok) {
             console.log("Deleted");
             // フィード更新（コメント数同期のため）
             if(appCallbacks.onLoadData) appCallbacks.onLoadData();
        } else {
            alert("削除に失敗しました");
            if (currentPostIdForModal) await loadComments(currentPostIdForModal);
        }
    } catch (e) {
        console.error(e);
        alert("エラーが発生しました");
    }
}

// ==============================
// イベント委譲セットアップ (共通)
// ==============================

export function setupCommonEventHandlers() {
    const eventHandlers = {
        '.like-btn': handleLike,
        '.comment-btn': handleCommentClick,
        '.repost-btn': handleRepost,
        '.bookmark-btn': handleBookmark,
        '.delete-post-btn': handleDeletePost,
        '.delete-comment-btn': handleDeleteComment
    };

    document.addEventListener('click', (e) => {
        // 各種アクションボタン
        for (const [selector, handler] of Object.entries(eventHandlers)) {
            const el = e.target.closest(selector);
            if (el) {
                e.preventDefault();
                e.stopPropagation();
                handler(el);
                return;
            }
        }

        // 投稿クリック（詳細ページ遷移）
        // 既に詳細ページにいる場合や、モーダル内、ボタンクリック時は無視したい
        // "post-detail" ページでは遷移しないように制御が必要だが、
        // 簡易的に URL に 'post_detail.html' が含まれていなければ遷移とする
        if (!window.location.href.includes('post_detail.html')) {
            const postArticle = e.target.closest('.post');
            if (postArticle && !e.target.closest('button') && !e.target.closest('a') && !e.target.closest('.modal')) {
                const postId = postArticle.dataset.id;
                if (postId) {
                    window.location.href = `post_detail.html?postId=${postId}`;
                }
            }
        }
    });

    // モーダル初期化
    initModals();
}

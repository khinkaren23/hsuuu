// ==================================================
// post_detail.js
// ==================================================

// ▼▼▼ ここを実在するユーザーIDに書き換えてください ▼▼▼
const CURRENT_USER_ID = "1aVxtG72jiGR1SinFNR6"; // テスト用の固定ユーザーID
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

// const API_BASE_ROOT = "http://localhost:8080";
// const IMAGE_BASE_URL = "http://localhost:8080/"; // 画像のベースURL
// ▼▼▼ 変更後（環境に合わせて自動取得） ▼▼▼
const API_BASE_ROOT = window.location.origin;
const IMAGE_BASE_URL = window.location.origin + "/";
let backendAvailable = true; // サーバー接続状態管理

// URLパラメータからpostIdを取得
const urlParams = new URLSearchParams(window.location.search);
const POST_ID = urlParams.get('postId');

if (!POST_ID) {
    alert("投稿IDが指定されていません");
    window.location.href = 'index.html';
}

// ==============================
// ユーティリティ関数
// ==============================

// 認証付きfetchのラッパー
async function fetchWithAuth(url, options = {}) {
    try {
        const res = await fetch(url, options);
        backendAvailable = true;
        return res;
    } catch (e) {
        console.error("Fetch Error:", e);
        backendAvailable = false;
        throw e;
    }
}

// HTMLエスケープ処理
function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

// 画像パスを綺麗にする関数
function getImageUrl(path) {
    if (!path || path === "null") return "https://placekitten.com/50/50"; // デフォルト画像
    if (path.startsWith("http")) return path;
    
    let cleanPath = path.startsWith("/") ? path.substring(1) : path;
    if (!cleanPath.startsWith("uploads/") && !cleanPath.startsWith("img/")) {
        cleanPath = "uploads/" + cleanPath;
    }
    return `${IMAGE_BASE_URL}${cleanPath}`;
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

    // コメントボタン（詳細ページではフォーカス移動などにするか、何もしない）
    const commentBtn = e.target.closest('.comment-btn');
    if (commentBtn) {
        e.preventDefault();
        const type = commentBtn.dataset.type;
        if (type === 'post') {
            document.getElementById('commentText').focus();
        } else if (type === 'comment') {
            const id = commentBtn.dataset.id;
            const text = prompt("返信を入力:");
            if (text) submitComment(id, text, "comment");
        }
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
});

// ==============================
// データ読み込み & 表示
// ==============================

async function loadPostDetail() {
    const contentEl = document.getElementById("post-content");
    if (!contentEl) return;

    try {
        // 単一投稿取得APIがあると仮定。なければ一覧から探すなどの対応が必要だが、通常はあるはず。
        // App.jsには一覧取得しかなかったが、RESTfulなら /posts/{id} があるはず。
        const res = await fetchWithAuth(`${API_BASE_ROOT}/posts/${POST_ID}?viewingUserId=${CURRENT_USER_ID}`);
        
        if (res.ok) {
            const post = await res.json();
            contentEl.innerHTML = renderPostHTML(post);
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

// 投稿HTML生成（App.jsと同じだが、詳細ページ用に微調整可能）
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

    return `
    <article class="post" style="border-bottom: 1px solid #eee; padding: 12px;">
        <div class="post-header" style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
            <img src="${avatarUrl}" alt="avatar" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">
            <div class="user-info">
                <a href="profile.html?userId=${post.user ? post.user.id : ''}" style="text-decoration: none; color: inherit;">
                    <strong>${escapeHtml(username)}</strong>
                </a>
                <span style="color:#888; font-size:12px; margin-left:8px;">${timeDisplay}</span>
            </div>
        </div>

        <div class="post-content">
            <p style="white-space: pre-wrap; font-size: 1.1em;">${escapeHtml(post.content)}</p>
            ${imagesHtml}
        </div>

        ${repostHtml}

        <div class="post-actions" style="display:flex; gap:20px; margin-top:12px; color:#555;">
            
            <button class="like-btn" data-id="${post.id}" data-type="post" style="background:none; border:none; cursor:pointer;">
                <i class="${heartClass}" style="color: ${heartColor}"></i> ${post.likeCount || 0}
            </button>

            <button class="comment-btn" data-id="${post.id}" data-type="post" style="background:none; border:none; cursor:pointer;">
                <i class="fa-regular fa-comment"></i> ${post.commentCount || 0}
            </button>

            <button class="repost-btn" data-id="${post.id}" style="background:none; border:none; cursor:pointer;">
                <i class="fa-solid fa-retweet" style="${post.repostedPost ? 'color:#00ba7c;' : ''}"></i>
            </button>

            <button class="bookmark-btn" data-id="${post.id}" style="background:none; border:none; cursor:pointer;">
                <i class="${post.bookmarkedByCurrentUser ? 'fa-solid' : 'fa-regular'} fa-bookmark" style="${post.bookmarkedByCurrentUser ? 'color:#FFD700;' : ''}"></i>
            </button>

            ${post.user && String(post.user.id) === String(CURRENT_USER_ID) ? 
            `<button class="delete-post-btn" data-id="${post.id}" style="background:none; border:none; cursor:pointer; color:#999;">
                <i class="fa-solid fa-trash"></i>
            </button>` : ''}
            
        </div>
    </article>
    `;
}

// ==============================
// コメント関連
// ==============================

async function loadComments(postId) {
    const listEl = document.getElementById("commentList");
    if (!listEl) return;
    listEl.innerHTML = "<p>読み込み中...</p>";

    try {
        const res = await fetchWithAuth(`${API_BASE_ROOT}/posts/${postId}/comments?viewingUserId=${CURRENT_USER_ID}`);
        if (res.ok) {
            const comments = await res.json();
            if (comments.length === 0) {
                listEl.innerHTML = "<p>コメントはありません</p>";
            } else {
                const commentMap = new Map();
                const topLevelComments = [];

                comments.forEach(c => {
                    if (!commentMap.has(c.id)) {
                        commentMap.set(c.id, { ...c, replies: [] });
                    } else {
                        const existing = commentMap.get(c.id);
                        commentMap.set(c.id, { ...c, replies: existing.replies });
                    }
                    if (c.parentId) {
                        if (!commentMap.has(c.parentId)) commentMap.set(c.parentId, { replies: [] });
                        commentMap.get(c.parentId).replies.push(c.id);
                    } else {
                        topLevelComments.push(c.id);
                    }
                });

                // 最新順ソート
                const sortByDateDesc = (idA, idB) => {
                    const dateA = new Date(commentMap.get(idA).createdAt || 0);
                    const dateB = new Date(commentMap.get(idB).createdAt || 0);
                    return dateB - dateA;
                };
                topLevelComments.sort(sortByDateDesc);
                commentMap.forEach(comment => {
                    if (comment.replies) comment.replies.sort(sortByDateDesc);
                });

                function renderCommentRecursive(commentId, level = 0) {
                    const comment = commentMap.get(commentId);
                    if (!comment || !comment.user) return "";

                    const cUser = comment.user ? comment.user.username : "Unknown";
                    const heartClass = comment.likedByCurrentUser ? "fa-solid fa-heart" : "fa-regular fa-heart";
                    const heartColor = comment.likedByCurrentUser ? "#ff4d4d" : "";
                    const indentStyle = level > 0 ? `margin-left: ${level * 30}px; border-left: 2px solid #eee; padding-left: 10px;` : "";
                    const replyIcon = level > 0 ? '<i class="fa-solid fa-turn-up" style="transform: rotate(90deg); margin-right: 5px; color: #ccc;"></i>' : '';
                    
                    const isMyComment = (comment.user && String(comment.user.id) === String(CURRENT_USER_ID));
                    const deleteBtnHtml = isMyComment ? 
                        `<button class="delete-comment-btn" data-id="${comment.id}" style="border:none; background:none; cursor:pointer; color:#999; font-size:0.9em;">
                            <i class="fa-solid fa-trash"></i>
                        </button>` : '';

                    let html = `
                    <div class="comment-item" style="border-bottom:1px solid #eee; padding:8px 0; ${indentStyle}">
                        <div style="font-size: 0.85em; color: #555;">
                            ${replyIcon}<strong>${escapeHtml(cUser)}</strong>
                        </div>
                        <p style="margin: 4px 0;">${escapeHtml(comment.content)}</p>
                        <div class="comment-actions" style="font-size:0.9em; display:flex; gap:15px; margin-top:4px;">
                            <button class="like-btn" data-id="${comment.id}" data-type="comment" style="border:none; background:none; cursor:pointer;">
                                <i class="${heartClass}" style="color: ${heartColor}"></i> ${comment.likeCount || 0}
                            </button>
                            <button class="comment-btn" data-id="${comment.id}" data-type="comment" style="border:none; background:none; cursor:pointer; color:blue;">
                                返信
                            </button>
                            ${deleteBtnHtml}
                        </div>
                    </div>`;

                    if (comment.replies) {
                        comment.replies.forEach(replyId => {
                            html += renderCommentRecursive(replyId, level + 1);
                        });
                    }
                    return html;
                }
                listEl.innerHTML = topLevelComments.map(id => renderCommentRecursive(id)).join("");
            }
        } else {
            listEl.innerHTML = "<p>コメントの読み込みに失敗しました</p>";
        }
    } catch (e) {
        console.error(e);
        listEl.innerHTML = "<p>エラーが発生しました</p>";
    }
}

// コメント送信
const submitCommentBtn = document.getElementById("submitCommentBtn");
if (submitCommentBtn) {
    submitCommentBtn.addEventListener("click", () => {
        const text = document.getElementById("commentText").value;
        if (text) {
            submitComment(POST_ID, text, "post");
            document.getElementById("commentText").value = "";
        }
    });
}

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
            loadComments(POST_ID);
            // 投稿自体のコメント数も更新したいが、再ロードするほどではないかも
        } else {
            alert("送信に失敗しました。");
        }
    } catch(e) {
        console.error(e);
        alert("エラーが発生しました。");
    }
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

async function handleDeleteComment(button) {
    const commentId = button.dataset.id;
    if (!confirm("このコメントを削除しますか？")) return;

    try {
        const res = await fetchWithAuth(`${API_BASE_ROOT}/comments/${commentId}?userId=${CURRENT_USER_ID}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            loadComments(POST_ID);
        } else {
            alert("削除に失敗しました");
        }
    } catch (e) {
        console.error(e);
        alert("エラーが発生しました");
    }
}

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
// リポストモーダル関連
// ==============================
const repostModal = document.getElementById("repostModal");
const confirmRepostBtn = document.getElementById("confirmRepostBtn");
const cancelRepostBtn = document.getElementById("cancelRepostBtn");
let currentPostIdForRepost = null;

function handleRepost(button) {
    const postId = button.dataset.id;
    if (repostModal) {
        currentPostIdForRepost = postId;
        repostModal.style.display = "flex";
    } else {
        if(!confirm("この投稿をリポストしますか？")) return;
        executeRepost(postId);
    }
}

async function executeRepost(postId) {
    try {
        const res = await fetchWithAuth(`${API_BASE_ROOT}/posts/${postId}/repost?userId=${CURRENT_USER_ID}`, {
            method: "POST"
        });
        if(res.ok) {
            alert("リポストしました！");
            // リロードするか、ボタンの状態を変える
        } else {
            alert("リポストに失敗しました");
        }
    } catch(e) {
        console.error(e);
    }
}

if (confirmRepostBtn) {
    confirmRepostBtn.onclick = async () => {
        if (currentPostIdForRepost) {
            await executeRepost(currentPostIdForRepost);
            repostModal.style.display = "none";
            currentPostIdForRepost = null;
        }
    };
}

if (cancelRepostBtn) {
    cancelRepostBtn.onclick = () => {
        repostModal.style.display = "none";
        currentPostIdForRepost = null;
    };
}

// ==============================
// 投稿削除モーダル関連
// ==============================
const deleteModal = document.getElementById("deleteModal");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
let currentPostIdForDelete = null;

function handleDeletePost(button) {
    const postId = button.dataset.id;
    if (deleteModal) {
        currentPostIdForDelete = postId;
        deleteModal.style.display = "flex";
    } else {
        if(!confirm("削除しますか？")) return;
        executeDeletePost(postId);
    }
}

async function executeDeletePost(postId) {
    try {
        const res = await fetchWithAuth(`${API_BASE_ROOT}/posts/${postId}?userId=${CURRENT_USER_ID}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            alert("投稿を削除しました");
            window.location.href = 'index.html';
        } else {
            alert("削除に失敗しました");
        }
    } catch (e) {
        console.error(e);
        alert("エラーが発生しました");
    }
}

if (confirmDeleteBtn) {
    confirmDeleteBtn.onclick = async () => {
        if (currentPostIdForDelete) {
            await executeDeletePost(currentPostIdForDelete);
            deleteModal.style.display = "none";
            currentPostIdForDelete = null;
        }
    };
}

if (cancelDeleteBtn) {
    cancelDeleteBtn.onclick = () => {
        deleteModal.style.display = "none";
        currentPostIdForDelete = null;
    };
}

// 初期ロード
loadPostDetail();

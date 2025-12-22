// ==================================================
// App.js - Optimized Version (Delete Modal Fixed)
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

// ==============================
// データ読み込み & 表示 (Core)
// ==============================

// 投稿一覧を読み込む
async function loadData() {
    console.log("Loading data...");
    const feed = document.getElementById("feed");
    if (!feed) return;

    try {
        const res = await fetchWithAuth(`${API_BASE_ROOT}/posts?viewingUserId=${CURRENT_USER_ID}`);
        if (res.ok) {
            const posts = await res.json();
            
            if (posts.length === 0) {
                feed.innerHTML = "<p style='text-align:center; padding:20px;'>投稿がありません</p>";
                return;
            }

            // 最新順（降順）にソート
            posts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

            // HTMLを一括生成して表示
            feed.innerHTML = posts.map(renderPostHTML).join("");
        } else {
            console.error("Failed to load posts:", res.status);
            feed.innerHTML = "<p style='text-align:center; padding:20px; color:red;'>データの読み込みに失敗しました</p>";
        }
    } catch (e) {
        console.error(e);
        feed.innerHTML = "<p style='text-align:center; padding:20px; color:gray;'>サーバーに接続できません</p>";
    }
}

// 投稿1つ分のHTMLを生成する関数
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
    <article class="post" data-id="${post.id}" style="border-bottom: 1px solid #eee; padding: 12px; cursor: pointer;">
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
            <p style="white-space: pre-wrap;">${escapeHtml(post.content)}</p>
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

function handleCommentClick(button) {
    const id = button.dataset.id;
    const type = button.dataset.type; 
    if (type === "post") {
        openCommentModal(id);
    } else if (type === "comment") {
        const text = prompt("返信を入力:");
        if (text) submitComment(id, text, "comment");
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
            if (currentPostIdForModal) loadComments(currentPostIdForModal);
        } else {
            alert("削除に失敗しました");
        }
    } catch (e) {
        console.error(e);
        alert("エラーが発生しました");
    }
}

// --- ブックマーク機能 ---
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
            // alert("リポストしました！");
            loadData(); 
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
    // モーダルがあれば使う、なければconfirm
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
            // alert("投稿を削除しました");
            loadData();
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

// ==============================
// コメント送信処理
// ==============================

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
            // alert("投稿しました！");
            if (type === "post") {
                loadComments(targetId);
                loadData(); 
            } else {
                loadData();
            }
        } else {
            alert("送信に失敗しました。");
        }
    } catch(e) {
        console.error(e);
        alert("エラーが発生しました。");
    }
}

// ==============================
// コメントモーダル関連
// ==============================

const commentModal = document.getElementById("commentModal");
const closeModalBtn = document.getElementById("closeModal");
const sendCommentBtn = document.getElementById("sendComment");
let currentPostIdForModal = null;

async function openCommentModal(postId) {
    const modal = document.getElementById("commentModal");
    if (!modal) return;
    currentPostIdForModal = postId;
    modal.style.display = "flex"; 
    await loadComments(postId);
}

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

if (closeModalBtn) {
    closeModalBtn.onclick = () => {
        commentModal.style.display = "none";
        currentPostIdForModal = null;
    };
}

if (sendCommentBtn) {
    sendCommentBtn.onclick = () => {
        const textEl = document.getElementById("commentText");
        const text = textEl ? textEl.value : "";
        if (text && currentPostIdForModal) {
            submitComment(currentPostIdForModal, text, "post");
            textEl.value = "";
        }
    };
}

// ==============================
// 新規投稿機能
// ==============================

function setupPostButton() {
    const btn = document.getElementById("submitPostBtn");
    if(!btn) return;
    
    btn.onclick = async () => {
        let content = "";
        const textArea = document.getElementById("postText"); 
        if (textArea) {
            content = textArea.value;
        } else {
            content = prompt("投稿内容を入力してください");
        }

        if (!content && selectedImages.length === 0) return;

        const fd = new FormData();
        fd.append("content", content || "");
        selectedImages.forEach(f => fd.append("images", f));

        try {
            const res = await fetchWithAuth(`${API_BASE_ROOT}/users/${CURRENT_USER_ID}/posts`, {
                method: "POST",
                body: fd
            });
            if(res.ok) {
                // alert("投稿しました");
                selectedImages = [];
                const preview = document.getElementById("imagePreviewContainer");
                if(preview) preview.style.display = "none";
                if(textArea) textArea.value = "";
                loadData();
            } else {
                alert("投稿エラー");
            }
        } catch(e) {
            console.error(e);
        }
    };
}

let selectedImages = [];
function setupImagePicker() {
    const picker = document.getElementById("imagePicker");
    const previewList = document.getElementById("imagePreviewList");
    
    const handleFiles = (files) => {
        selectedImages = [...selectedImages, ...Array.from(files)];
        const container = document.getElementById("imagePreviewContainer");
        if(container) container.style.display = "block";
        if(previewList) {
            previewList.innerHTML = selectedImages.map((f, i) => 
                `<img src="${URL.createObjectURL(f)}" style="height:60px; margin:2px;" onclick="removeImage(${i})">`
            ).join("");
        }
    };

    if (picker) {
        const imgIcon = document.querySelector(".fa-image");
        if (imgIcon) imgIcon.onclick = () => picker.click();
        picker.onchange = (e) => handleFiles(e.target.files);
    }

    const cameraInput = document.getElementById("cameraInput");
    const cameraIcon = document.querySelector(".fa-camera");
    if (cameraIcon && cameraInput) {
        cameraIcon.onclick = () => cameraInput.click();
        cameraInput.onchange = (e) => handleFiles(e.target.files);
    }
}

window.removeImage = function(index) {
    selectedImages.splice(index, 1);
    const previewList = document.getElementById("imagePreviewList");
    if(previewList) {
        previewList.innerHTML = selectedImages.map((f, i) => 
            `<img src="${URL.createObjectURL(f)}" style="height:60px; margin:2px;" onclick="removeImage(${i})">`
        ).join("");
    }
    if (selectedImages.length === 0) {
        const container = document.getElementById("imagePreviewContainer");
        if(container) container.style.display = "none";
    }
};

// ==============================
// 検索機能
// ==============================

function setupSearch() {
    console.log("setupSearch: 初期化");
    const searchInput = document.getElementById("searchInput");
    const searchIcon = document.querySelector(".search-container .fa-magnifying-glass"); 

    if (!searchInput) return;

    const executeSearch = async () => {
        const keyword = searchInput.value.trim();
        const feed = document.getElementById("feed");
        if (!keyword) {
            await loadData();
            return;
        }
        if (feed) feed.innerHTML = "<p style='text-align:center;'>検索中...</p>";

        try {
            const url = `${API_BASE_ROOT}/posts/search?keyword=${encodeURIComponent(keyword)}`;
            const res = await fetchWithAuth(url);
            if (res.ok) {
                const resultPosts = await res.json();
                if (resultPosts.length === 0) {
                    feed.innerHTML = "<p style='text-align:center;'>見つかりませんでした</p>";
                    return;
                }
                feed.innerHTML = resultPosts.map(renderPostHTML).join("");
            } else {
                feed.innerHTML = "<p style='text-align:center;'>検索エラー</p>";
            }
        } catch (e) {
            console.error(e);
            feed.innerHTML = "<p style='text-align:center;'>通信エラー</p>";
        }
    };

    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            executeSearch();
        }
    });

    if (searchIcon) {
        searchIcon.style.cursor = "pointer";
        searchIcon.onclick = executeSearch;
    }
}

// ==============================
// ユーザー情報 & アカウントページ
// ==============================
async function loadCurrentUser() {
    const nameEl = document.getElementById("currentUserName");
    const avatarEl = document.getElementById("currentUserAvatar");
    if (!nameEl && !avatarEl) return;

    try {
        const res = await fetchWithAuth(`${API_BASE_ROOT}/users/${CURRENT_USER_ID}`);
        if (res.ok) {
            const user = await res.json();
            if (nameEl) nameEl.textContent = user.username || "名無し";
            if (avatarEl && user.profileImageUrl && user.profileImageUrl !== "null") {
                avatarEl.src = getImageUrl(user.profileImageUrl);
            }
        }
    } catch (e) {
        console.error("ユーザー情報の取得に失敗:", e);
    }
}

async function loadAccountPage() {
    const nameEl = document.getElementById("accountName");
    const avatarEl = document.getElementById("accountAvatar");
    if(!nameEl) return;

    try {
        const res = await fetchWithAuth(`${API_BASE_ROOT}/users/${CURRENT_USER_ID}`);
        if (res.ok) {
            const user = await res.json();
            nameEl.textContent = (user.username || "名無し") + " さん";
            if (user.profileImageUrl && user.profileImageUrl !== "null") {
                const src = getImageUrl(user.profileImageUrl);
                if(avatarEl) {
                    avatarEl.style.backgroundImage = `url(${src})`;
                    avatarEl.style.backgroundSize = "cover";
                }
            }
        }
    } catch (e) {
        nameEl.textContent = "通信エラー";
    }
}

// ==============================
// アプリ起動 (Main)
// ==============================

document.addEventListener("DOMContentLoaded", async () => {
    const bodyId = document.body.id;
    setupSearch();

    if (bodyId === "index") {
        await loadCurrentUser();
        await loadData();
        setupPostButton();
        setupImagePicker();
    } else if (bodyId === "account") {
        await loadAccountPage();
    } else {
        setupPostButton();
        setupImagePicker();
    }
});
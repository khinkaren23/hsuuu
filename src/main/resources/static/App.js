
// ==================================================
// App.js - Optimized Version
// ==================================================
import { 
    API_BASE_ROOT, 
    CURRENT_USER_ID, 
    fetchWithAuth, 
    getImageUrl, 
    renderPostHTML,
    setupCommonEventHandlers,
    appCallbacks,
    injectCommonModals
} from './common.js';


// ==============================
// データ読み込み & 表示 (Core)
// ==============================

// 投稿一覧を読み込む
async function loadData() {
    console.log("Loading data...");
    const feed = document.getElementById("feed");
    if (!feed) return;

    try {
        const res = await fetchWithAuth(`${API_BASE_ROOT}/posts?viewingUserId=${CURRENT_USER_ID}&t=${Date.now()}`);
        if (res.ok) {
            const posts = await res.json();
            
            if (posts.length === 0) {
                feed.innerHTML = "<p style='text-align:center; padding:20px;'>投稿がありません</p>";
                return;
            }

            // 最新順（降順）にソート
            posts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

            // HTMLを一括生成して表示 (common.jsの関数を使用)
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

// ==============================
// 画像管理
// ==============================
let selectedImages = [];

function updateImagePreview() {
    const previewList = document.getElementById("imagePreviewList");
    if(!previewList) return;
    previewList.innerHTML = selectedImages.map((f, i) => 
        `<img src="${URL.createObjectURL(f)}" style="height:60px; margin:2px;" onclick="removeImage(${i})" alt="preview">`
    ).join("");
    
    const container = document.getElementById("imagePreviewContainer");
    if(container) container.style.display = selectedImages.length > 0 ? "block" : "none";
}

function handleFiles(files) {
    selectedImages = [...selectedImages, ...Array.from(files)];
    updateImagePreview();
}

window.removeImage = function(index) {
    selectedImages.splice(index, 1);
    updateImagePreview();
};

function setupImagePicker() {
    const picker = document.getElementById("imagePicker");
    const cameraInput = document.getElementById("cameraInput");
    
    if (picker) {
        const imgIcon = document.querySelector(".fa-image");
        if (imgIcon) {
            imgIcon.style.cursor = "pointer";
            imgIcon.onclick = () => picker.click();
        }
        picker.onchange = (e) => handleFiles(e.target.files);
    }

    if (cameraInput) {
        const cameraIcon = document.querySelector(".fa-camera");
        if (cameraIcon) {
            cameraIcon.style.cursor = "pointer";
            cameraIcon.onclick = () => cameraInput.click();
        }
        cameraInput.onchange = (e) => handleFiles(e.target.files);
    }
}

// ==============================
// 検索機能
// ==============================

function setupSearch() {
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
    // 共通セットアップ (イベント委譲, モーダル初期化)
    injectCommonModals();
    setupCommonEventHandlers();
    
    // コールバック登録 (common.jsのmodalManagerなどがloadDataを呼べるようにする)
    appCallbacks.onLoadData = loadData;

    setupSearch();
    
    const bodyId = document.body.id;
    
    if (bodyId === "index") {
        await loadCurrentUser();
        await loadData();
        setupPostButton();
        setupImagePicker();
    } else if (bodyId === "account") {
        await loadAccountPage();
    } else {
        // Other pages using App.js but not explicit IDs?
        if(document.getElementById("submitPostBtn")) setupPostButton();
        if(document.getElementById("imagePicker")) setupImagePicker();
    }
});

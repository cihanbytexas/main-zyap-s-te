import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// KEY VE URL BİLGİLERİ
const supabaseUrl = "https://ppdwtpjglkphayfxexhv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwZHd0cGpnbGtwaGF5ZnhleGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNTc5ODEsImV4cCI6MjA5NjgzMzk4MX0.fJIyyxfU15EgrNARWkISFHJvU7-o-QpZbIKbRc3q_-s";
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// DİL DEĞİŞTİRME SİSTEMİ
// ============================================
let currentLang = 'tr';
const langTrBtn = document.getElementById('lang-tr');
const langEnBtn = document.getElementById('lang-en');

function applyLanguage(lang) {
    currentLang = lang;
    langTrBtn.classList.toggle('active', lang === 'tr');
    langEnBtn.classList.toggle('active', lang === 'en');

    document.querySelectorAll('[data-tr]').forEach(el => {
        const text = lang === 'tr' ? el.getAttribute('data-tr') : el.getAttribute('data-en');
        if (text) {
            if (text.includes('<') && text.includes('>')) el.innerHTML = text;
            else el.textContent = text;
        }
    });

    document.querySelectorAll('[data-tr-placeholder]').forEach(el => {
        const ph = lang === 'tr' ? el.getAttribute('data-tr-placeholder') : el.getAttribute('data-en-placeholder');
        if (ph) el.placeholder = ph;
    });

    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.placeholder = lang === 'tr' ? 'Mesajınızı yazın...' : 'Type your message...';
    }

    renderColors();
    fetchApprovedReviews();
    document.documentElement.lang = lang === 'tr' ? 'tr' : 'en';
}

langTrBtn.addEventListener('click', () => applyLanguage('tr'));
langEnBtn.addEventListener('click', () => applyLanguage('en'));

// ============================================
// CHATBOT (AI ASİSTAN) MANTIĞI & DINAMIK ISIM
// ============================================
const openChatBtn = document.getElementById('open-chatbot');
const chatModal = document.getElementById('chat-modal');
const closeChatBtn = document.getElementById('close-chat');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');
const chatMessages = document.getElementById('chat-messages');

let chatInitialized = false;
let loggedInUserName = "Ziyaretçi"; // Fallback varsayılan isim

const addMessage = (text, type) => {
    const div = document.createElement('div');
    div.className = `msg msg-${type}`;
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
};

const showTypingIndicator = () => {
    const div = document.createElement('div');
    div.className = 'typing-indicator';
    div.innerHTML = `<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return div;
};

openChatBtn.onclick = () => {
    chatModal.style.display = 'flex';
    if (!chatInitialized) {
        chatInitialized = true;
        const typingEl = showTypingIndicator();
        setTimeout(() => {
            typingEl.remove();
            addMessage(currentLang === 'tr' ? `Merhaba ${loggedInUserName}! Ben Öz Yapı Market asistanı. Boya veya tesisat ürünlerimiz hakkında yardımcı olabilirim.` : `Hello ${loggedInUserName}! I am the Öz Yapı Market assistant. How can I help you?`, 'bot');
        }, 1200);
    }
};
closeChatBtn.onclick = () => chatModal.style.display = 'none';

const handleSend = async () => {
    const val = chatInput.value.trim();
    if (!val) return;
    addMessage(val, 'user');
    chatInput.value = '';
    const typingEl = showTypingIndicator();
    try {
        const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: loggedInUserName, message: val })
        });
        const data = await res.json();
        typingEl.remove();
        addMessage(data.reply || "Cevap alınamadı", 'bot');
    } catch (e) {
        typingEl.remove();
        addMessage(currentLang === 'tr' ? "Bağlantı hatası oluştu." : "Connection error.", 'bot');
    }
};
chatSend.onclick = handleSend;
chatInput.onkeypress = (e) => { if(e.key === 'Enter') handleSend(); };

// ============================================
// KARTELA & PDF MANTIĞI
// ============================================
const openModalBtn = document.getElementById('open-kartela-btn');
const modal = document.getElementById('kartela-modal');
const closeModalBtn = document.getElementById('close-modal');
const colorGrid = document.getElementById('modal-color-grid');
const colorSearch = document.getElementById('color-search');
const filterBtns = document.querySelectorAll('.filter-btn');
const openPdfBtn = document.getElementById('open-pdf-btn');
const pdfModal = document.getElementById('pdf-modal');
const closePdfModalBtn = document.getElementById('close-pdf-modal');

if(openPdfBtn) openPdfBtn.onclick = () => { modal.style.display = 'none'; pdfModal.style.display = 'flex'; };
if(closePdfModalBtn) closePdfModalBtn.onclick = () => { pdfModal.style.display = 'none'; modal.style.display = 'flex'; };

let activeFilter = 'all';
let searchTerm = '';

function renderColors() {
    if (!colorGrid) return;
    colorGrid.innerHTML = '';
    if (typeof colorList === 'undefined') return;
    const filtered = colorList.filter(color => {
        return color.name.toLowerCase().includes(searchTerm.toLowerCase()) && (activeFilter === 'all' || color.type === activeFilter);
    });
    const typeLabel = currentLang === 'tr' ? { ic: 'İç Cephe', dis: 'Dış Cephe' } : { ic: 'Interior', dis: 'Exterior' };
    filtered.forEach(color => {
        const item = document.createElement('div');
        item.className = 'color-item';
        item.innerHTML = `<div class="swatch-preview" style="background-color: ${color.hex}"></div><span>${color.name}</span><div style="font-size:0.6rem; color:#9ca3af; margin-top:4px;">${typeLabel[color.type]}</div>`;
        colorGrid.appendChild(item);
    });
}
if(colorSearch) colorSearch.addEventListener('input', (e) => { searchTerm = e.target.value; renderColors(); });
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.getAttribute('data-type');
        renderColors();
    });
});
if(openModalBtn) openModalBtn.onclick = () => { modal.style.display = 'flex'; renderColors(); };
if(closeModalBtn) closeModalBtn.onclick = () => modal.style.display = 'none';

// ============================================
// REVIEWS (KULLANICI VİTRİN YORUMLARI)
// ============================================
const reviewModal = document.getElementById('review-modal');
const openReviewBtn = document.getElementById('open-review-modal');
const closeReviewBtn = document.getElementById('close-review-modal');
if (openReviewBtn) openReviewBtn.onclick = () => reviewModal.style.display = 'flex';
if (closeReviewBtn) closeReviewBtn.onclick = () => reviewModal.style.display = 'none';

let selectedRating = 0;
document.querySelectorAll('#star-rating-container .review-star').forEach(star => {
    star.addEventListener('click', function() {
        selectedRating = parseInt(this.getAttribute('data-value'));
        updateStarDisplay(selectedRating);
    });
    star.addEventListener('mouseover', function() {
        updateStarDisplay(parseInt(this.getAttribute('data-value')));
    });
});
document.getElementById('star-rating-container')?.addEventListener('mouseleave', () => updateStarDisplay(selectedRating));

function updateStarDisplay(value) {
    document.querySelectorAll('#star-rating-container .review-star').forEach(star => {
        star.style.color = parseInt(star.getAttribute('data-value')) <= value ? '#f59e0b' : '#cbd5e1';
    });
}

async function fetchApprovedReviews() {
    const grid = document.getElementById('dynamic-testimonials-list');
    if (!grid) return;
    try {
        const res = await fetch('/api/reviews');
        const reviews = await res.json();
        if(!reviews || reviews.length === 0) {
            grid.innerHTML = `<p style="text-align:center; grid-column:1/-1;">Henüz yorum yok.</p>`;
            return;
        }
        grid.innerHTML = '';
        reviews.forEach(r => {
            grid.innerHTML += `
                <div class="testimonial-card">
                    <i class="fa-solid fa-quote-right quote-icon"></i>
                    <div class="stars">${'<i class="fa-solid fa-star"></i>'.repeat(r.puan)}${`<i class="fa-regular fa-star" style="color:#cbd5e1"></i>`.repeat(5 - r.puan)}</div>
                    <p>"${r.yorum_metni}"</p>
                    <div class="client-info">
                        <div class="client-avatar" style="background:#1e3a8a; color:white; display:flex; align-items:center; justify-content:center; font-weight:bold;">${r.ad_soyad.charAt(0).toUpperCase()}</div>
                        <div><h4>${r.ad_soyad}</h4><span>${r.kategori}</span></div>
                    </div>
                </div>`;
        });
    } catch (e) {}
}

const reviewForm = document.getElementById('user-review-form');
if(reviewForm) {
    reviewForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        if(selectedRating === 0) return alert("Puan seçin.");
        const payload = { ad_soyad: document.getElementById('rev-name').value, kategori: document.getElementById('rev-category').value, puan: selectedRating, yorum_metni: document.getElementById('rev-text').value };
        try {
            const res = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            if(data.success) { alert("Yorum iletildi."); reviewForm.reset(); selectedRating = 0; updateStarDisplay(0); reviewModal.style.display = 'none'; }
        } catch(err) {}
    });
}

// ============================================================================
// ÖZ SOCIAL & AUTH: DEV SOSYAL MEDYA MOTORU (KUSURSUZ ENTEGRASYON)
// ============================================================================
const authModal = document.getElementById('auth-modal');
const closeAuthModal = document.getElementById('close-auth-modal');
const navAuthTriggerBtn = document.getElementById('nav-auth-trigger-btn');
const navAuthBtnText = document.getElementById('nav-auth-btn-text');
const openOzSocialBtn = document.getElementById('open-oz-social-btn');
const ozSocialPortal = document.getElementById('oz-social-portal');
const closeSocialPortalBtn = document.getElementById('close-social-portal-btn');
const mainSiteLogo = document.getElementById('main-site-logo');

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const forgotPasswordForm = document.getElementById('forgot-password-form');
const resetPasswordForm = document.getElementById('reset-password-form');

const showRegister = document.getElementById('show-register');
const showLogin = document.getElementById('show-login');
const showForgotPassword = document.getElementById('show-forgot-password');
const backToLogin = document.getElementById('back-to-login');

// Portal DOM Elementleri
const portalDashName = document.getElementById('portal-dash-name');
const portalDashRole = document.getElementById('portal-dash-role');
const portalDashEmail = document.getElementById('portal-dash-email');
const portalDashBio = document.getElementById('portal-dash-bio');
const portalDashAvatar = document.getElementById('portal-dash-avatar');
const portalDashAvatarTrigger = document.getElementById('portal-dash-avatar-trigger');

const portalEditProfileBtn = document.getElementById('portal-edit-profile-btn');
const portalEditProfileForm = document.getElementById('portal-edit-profile-form');
const portalEditName = document.getElementById('portal-edit-name');
const portalEditBio = document.getElementById('portal-edit-bio');
const portalEditAvatarImg = document.getElementById('portal-edit-avatar-img');
const portalEditAvatarInput = document.getElementById('portal-edit-avatar-input');
const portalCancelEditBtn = document.getElementById('portal-cancel-edit-btn');

const portalFeedList = document.getElementById('portal-feed-list');
const portalFeedFilters = document.querySelectorAll('.portal-feed-filter');
const portalOpenCreatePost = document.getElementById('portal-open-create-post');
const portalCreatePostModal = document.getElementById('portal-create-post-modal');
const portalClosePostModal = document.getElementById('portal-close-post-modal');
const portalCreatePostForm = document.getElementById('portal-create-post-form');
const portalPostMedia = document.getElementById('portal-post-media');
const portalPostText = document.getElementById('portal-post-text');
const portalSubmitPostBtn = document.getElementById('portal-submit-post-btn');
const portalMediaUploadContainer = document.getElementById('portal-media-upload-container');

const portalNotificationBtn = document.getElementById('portal-notification-btn');
const notificationBadge = document.getElementById('notification-badge');
const notificationModal = document.getElementById('notification-modal');
const closeNotificationModalBtn = document.getElementById('close-notification-modal');
const notificationList = document.getElementById('notification-list');

const portalMessagesBtn = document.getElementById('portal-messages-btn');
const messagesBadge = document.getElementById('messages-badge');
const messagesListModal = document.getElementById('messages-list-modal');
const closeMessagesListModalBtn = document.getElementById('close-messages-list-modal-btn');
const conversationsList = document.getElementById('conversations-list');

const chatModalDm = document.getElementById('chat-modal-dm');
const closeChatDmBtn = document.getElementById('close-chat-dm-btn');
const chatDmHistory = document.getElementById('chat-dm-history');
const chatDmForm = document.getElementById('chat-dm-form');
const chatDmInput = document.getElementById('chat-input');
const chatDmMediaInput = document.getElementById('chat-dm-media-input');
const chatDmTypingIndicator = document.getElementById('chat-typing-indicator');
const chatDmAvatar = document.getElementById('chat-dm-avatar');
const chatDmName = document.getElementById('chat-dm-name');
const messageUserBtn = document.getElementById('message-user-btn');

const likesModal = document.getElementById('likes-modal');
const closeLikesModalBtn = document.getElementById('close-likes-modal-btn');
const likesList = document.getElementById('likes-list');

const userProfileModal = document.getElementById('user-profile-modal');
const closeUserProfileBtn = document.getElementById('close-user-profile-btn');
const upHeaderName = document.getElementById('up-header-name');
const upAvatar = document.getElementById('up-avatar');
const upPostCount = document.getElementById('up-post-count');
const upFollowerCount = document.getElementById('up-follower-count');
const upFollowingCount = document.getElementById('up-following-count');
const upName = document.getElementById('up-name');
const upRole = document.getElementById('up-role');
const upBio = document.getElementById('up-bio');
const upGrid = document.getElementById('up-grid');
const followBtn = document.getElementById('follow-btn');
const unfollowBtn = document.getElementById('unfollow-btn');
const tabGrid = document.getElementById('tab-grid');
const tabQuestions = document.getElementById('tab-questions');
const upQuestionsList = document.getElementById('up-questions-list');

const singlePostModal = document.getElementById('single-post-modal');
const closeSinglePostBtn = document.getElementById('close-single-post-btn');
const singlePostContainer = document.getElementById('single-post-container');

// Arama DOM elemanları
const portalUserSearch = document.getElementById('portal-user-search');
const searchResultsBox = document.getElementById('search-results-box');
const portalUserSearchMobile = document.getElementById('portal-user-search-mobile');
const searchResultsBoxMobile = document.getElementById('search-results-box-mobile');

let currentUserSession = null;
let activeReplyData = {};
let selectedAvatarFile = null;
let selectedUpdateAvatarFile = null;
let currentlyViewingProfileId = null;
let currentChatUserId = null;
let chatBroadcastChannel = null;
let typingTimeout;

// Auth Panel Tetikleyicisi
navAuthTriggerBtn.addEventListener('click', () => {
    if (currentUserSession) {
        // Oturum varsa direkt Öz Social portalını açar
        openSocialPortal();
    } else {
        authModal.classList.remove('hidden');
        toggleAuthForms(loginForm);
    }
});
closeAuthModal.addEventListener('click', () => authModal.classList.add('hidden'));

// Logo ve Balon Tıklaması
mainSiteLogo.addEventListener('click', (e) => {
    if (currentUserSession) { e.preventDefault(); openSocialPortal(); }
});
openOzSocialBtn.addEventListener('click', () => openSocialPortal());
closeSocialPortalBtn.addEventListener('click', () => {
    ozSocialPortal.classList.add('translate-x-full');
    setTimeout(() => ozSocialPortal.classList.add('hidden'), 300);
});

function openSocialPortal() {
    ozSocialPortal.classList.remove('hidden');
    setTimeout(() => ozSocialPortal.classList.remove('translate-x-full'), 10);
    loadFeed(currentFeedFilter);
    checkNotificationsBadge();
    checkMessagesBadge();
}

// Form Değişimleri
showRegister.onclick = () => toggleAuthForms(registerForm);
showLogin.onclick = () => toggleAuthForms(loginForm);
showForgotPassword.onclick = () => toggleAuthForms(forgotPasswordForm);
backToLogin.onclick = () => toggleAuthForms(loginForm);

// KAYIT MOTORU
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('register-btn');
    btn.innerHTML = 'İşlem Yapılıyor...'; btn.disabled = true;
    try {
        const { data: authData, error: authError } = await supabase.auth.signUp({ email: document.getElementById('reg-email').value, password: document.getElementById('reg-password').value });
        if (authError) throw authError;

        let finalAvatarUrl = null;
        if (selectedAvatarFile && authData.user) {
            const ext = selectedAvatarFile.name.split('.').pop();
            const fileName = `${authData.user.id}-${Date.now()}.${ext}`;
            await supabase.storage.from('avatars').upload(fileName, selectedAvatarFile);
            finalAvatarUrl = supabase.storage.from('avatars').getPublicUrl(fileName).data.publicUrl;
        }
        if (authData.user) {
            await supabase.from('uyeler').insert([{ id: authData.user.id, ad_soyad: document.getElementById('reg-name').value, rol: document.getElementById('reg-role').value, avatar_url: finalAvatarUrl, biyografi: "" }]);
        }
        Swal.fire({ icon: 'success', title: 'Başarılı', text: 'Kayıt olundu, giriş yapabilirsiniz.' });
        registerForm.reset(); authModal.classList.add('hidden');
    } catch (error) { Swal.fire({ icon: 'error', text: error.message }); }
    finally { btn.innerHTML = 'Kayıt Ol'; btn.disabled = false; }
});

// GİRİŞ MOTORU
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    btn.innerHTML = 'Bekleyin...'; btn.disabled = true;
    try {
        const { error } = await supabase.auth.signInWithPassword({ email: document.getElementById('login-email').value, password: document.getElementById('login-password').value });
        if (error) throw error;
        authModal.classList.add('hidden');
        checkSession();
    } catch (error) { Swal.fire({ icon: 'error', title: 'Başarısız', text: "Giriş bilgileri hatalı!" }); }
    finally { btn.innerHTML = 'Giriş Yap'; btn.disabled = false; }
});

// OTURUM STATE YÖNETİMİ & DINAMIK GÜNCELLEMELER
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        currentUserSession = session;
        openOzSocialBtn.classList.remove('hidden'); // Öz Social Balonunu Göster
        navAuthBtnText.innerText = "Öz Social Girişi";

        try {
            const { data: userData } = await supabase.from('uyeler').select('*').eq('id', session.user.id).single();
            if (userData) {
                loggedInUserName = userData.ad_soyad; // AI Bot bu isimle konuşacak
                
                // Müşteri Yorum alanı senkronizasyonu ( Readonly Kilit )
                const revNameInput = document.getElementById('rev-name');
                if (revNameInput) { revNameInput.value = userData.ad_soyad; revNameInput.readOnly = true; revNameInput.style.background = "#e2e8f0"; }

                // Portal Panel Verisi
                portalDashName.innerText = userData.ad_soyad;
                portalDashRole.innerText = userData.rol;
                portalDashEmail.innerText = session.user.email;
                portalDashBio.innerText = userData.biyografi || 'Biyografi eklenmemiş.';
                portalDashAvatar.src = userData.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.ad_soyad)}&background=1e3a8a&color=fff`;
                portalDashAvatarTrigger.setAttribute('data-user-id', session.user.id);
                portalDashName.setAttribute('data-user-id', session.user.id);
            }
        } catch (e) {}
        setupRealtime();
        checkNotificationsBadge();
        checkMessagesBadge();
    } else {
        currentUserSession = null;
        openOzSocialBtn.classList.add('hidden');
        navAuthBtnText.innerText = "Giriş Yap";
        loggedInUserName = "Ziyaretçi";
        const revNameInput = document.getElementById('rev-name');
        if (revNameInput) { revNameInput.value = ""; revNameInput.readOnly = false; revNameInput.style.background = "#f9fafb"; }
    }
}

// CANLI ARALIK RADARI (REALTIME)
function setupRealtime() {
    if (realtimeChannel) return;
    realtimeChannel = supabase.channel('oz-yapi-realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'gonderiler' }, async (payload) => {
            if (payload.new.user_id !== currentUserSession?.user?.id) {
                const { data: newPost } = await supabase.from('gonderiler').select(`*, yazar:uyeler(ad_soyad, avatar_url, rol), etkilesimler(id, user_id), gonderi_yorumlari(id, metin, created_at, user_id, ust_yorum_id, yazar:uyeler(ad_soyad, avatar_url, rol))`).eq('id', payload.new.id).single();
                if (newPost && (currentFeedFilter === 'all' || currentFeedFilter === newPost.gonderi_tipi)) {
                    portalFeedList.insertAdjacentHTML('afterbegin', generatePostHTML(newPost, false));
                }
            }
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bildirimler' }, (payload) => {
            if (payload.new.alici_id === currentUserSession?.user?.id) notificationBadge.classList.remove('hidden');
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'mesajlar' }, (payload) => {
            const isRelated = payload.new?.alici_id === currentUserSession?.user?.id || payload.new?.gonderen_id === currentUserSession?.user?.id || payload.old?.gonderen_id === currentUserSession?.user?.id;
            if (isRelated) {
                if (payload.eventType === 'INSERT') {
                    if (currentChatUserId === payload.new.gonderen_id || currentChatUserId === payload.new.alici_id) {
                        const isMine = payload.new.gonderen_id === currentUserSession.user.id;
                        appendMessageToUI(payload.new, isMine);
                        if (!isMine) supabase.from('mesajlar').update({okundu: true}).eq('id', payload.new.id).then(()=>{});
                    } else if (payload.new.alici_id === currentUserSession.user.id) {
                        checkMessagesBadge();
                        if (!messagesListModal.classList.contains('hidden')) loadConversations();
                    }
                }
                else if (payload.eventType === 'UPDATE') {
                    const wrap = document.getElementById(`msg-wrapper-${payload.new.id}`);
                    if (wrap) {
                        const heart = wrap.querySelector('.msg-heart');
                        if (payload.new.begendi) { heart.classList.remove('scale-0', 'opacity-0'); heart.classList.add('scale-100', 'opacity-100'); }
                        else { heart.classList.remove('scale-100', 'opacity-100'); heart.classList.add('scale-0', 'opacity-0'); }
                        const ri = wrap.querySelector('.msg-read-status');
                        if (ri && payload.new.okundu) ri.className = 'msg-read-status fa-solid fa-check-double text-blue-500 ml-1';
                    }
                }
                else if (payload.eventType === 'DELETE') {
                    const wrapper = document.getElementById(`msg-wrapper-${payload.old.id}`);
                    if(wrapper) wrapper.remove();
                }
            }
        }).subscribe();

    if(!chatBroadcastChannel) {
        chatBroadcastChannel = supabase.channel('chat-typing');
        chatBroadcastChannel.on('broadcast', { event: 'typing' }, p => {
            if (p.payload.to === currentUserSession.user.id && p.payload.from === currentChatUserId && !chatModalDm.classList.contains('hidden')) {
                chatDmTypingIndicator.classList.remove('hidden'); chatDmTypingIndicator.classList.add('flex');
                chatDmHistory.scrollTop = chatDmHistory.scrollHeight;
                clearTimeout(typingTimeout);
                typingTimeout = setTimeout(() => { chatDmTypingIndicator.classList.remove('flex'); chatDmTypingIndicator.classList.add('hidden'); }, 2000);
            }
        }).subscribe();
    }
}

// GÜVENLİ ÇIKIŞ MOTORU
document.getElementById('portal-logout-btn').addEventListener('click', () => {
    Swal.fire({ title: 'Çıkış?', text: "Oturumu sonlandırıyorum.", icon: 'question', showCancelButton: true, confirmButtonText: 'Evet' }).then(async res => {
        if(res.isConfirmed) {
            if(realtimeChannel) { supabase.removeChannel(realtimeChannel); realtimeChannel = null; }
            await supabase.auth.signOut();
            ozSocialPortal.classList.add('hidden');
            checkSession();
        }
    });
});

// ============================================================================
// DİNAMİK CANLI KULLANICI ARAMA MOTORU (YENİ ÖZELLİK)
// ============================================================================
async function searchUsers(term, boxEl) {
    if(!term.trim()) { boxEl.classList.add('hidden'); boxEl.innerHTML = ''; return; }
    try {
        const { data: users, error } = await supabase
            .from('uyeler')
            .select('id, ad_soyad, avatar_url, rol')
            .ilike('ad_soyad', `%${term}%`)
            .limit(8);
        
        if(error) throw error;
        
        if(!users || users.length === 0) {
            boxEl.innerHTML = '<div class="p-3 text-center text-xs text-slate-400">Sonuç bulunamadı.</div>';
            boxEl.classList.remove('hidden');
            return;
        }
        
        boxEl.innerHTML = users.map(u => {
            const av = u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.ad_soyad)}`;
            return `
                <div class="p-2.5 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100 user-profile-trigger" data-user-id="${u.id}" onclick="this.parentElement.classList.add('hidden')">
                    <img src="${av}" class="w-8 h-8 rounded-full object-cover border">
                    <div>
                        <div class="text-xs font-bold text-slate-800">${u.ad_soyad}</div>
                        <div class="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">${u.rol}</div>
                    </div>
                </div>
            `;
        }).join('');
        boxEl.classList.remove('hidden');
    } catch(e) { boxEl.classList.add('hidden'); }
}

portalUserSearch.addEventListener('input', (e) => searchUsers(e.target.value, searchResultsBox));
portalUserSearchMobile.addEventListener('input', (e) => searchUsers(e.target.value, searchResultsBoxMobile));

// Dışarı tıklayınca arama kutularını kapatma
document.addEventListener('click', (e) => {
    if(!portalUserSearch.contains(e.target)) searchResultsBox.classList.add('hidden');
    if(!portalUserSearchMobile.contains(e.target)) searchResultsBoxMobile.classList.add('hidden');
});
// ============================================================================
// GÖNDERİ OLUŞTURMA VE AKIŞ (FEED) MOTORU
// ============================================================================

// Soru / Medya Seçimi Değişimi
const portalPostTypeRadios = document.getElementsByName('portal_post_type');
portalPostTypeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if(e.target.value === 'medya') portalMediaUploadContainer.classList.remove('hidden');
        else { portalMediaUploadContainer.classList.add('hidden'); portalPostMedia.value = ''; }
    });
});

portalOpenCreatePost.addEventListener('click', () => portalCreatePostModal.classList.remove('hidden'));
portalClosePostModal.addEventListener('click', () => { 
    portalCreatePostModal.classList.add('hidden'); 
    portalCreatePostForm.reset(); 
    portalMediaUploadContainer.classList.add('hidden'); 
});

// Yeni Gönderi Paylaşma
portalCreatePostForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    portalSubmitPostBtn.innerHTML = 'Paylaşılıyor...'; portalSubmitPostBtn.disabled = true;
    try {
        let finalMediaUrl = null;
        const postType = document.querySelector('input[name="portal_post_type"]:checked').value;
        
        if (postType === 'medya' && portalPostMedia.files[0]) {
            const file = portalPostMedia.files[0];
            const ext = file.name.split('.').pop();
            const fileName = `post-${Date.now()}.${ext}`;
            await supabase.storage.from('medya').upload(fileName, file);
            finalMediaUrl = supabase.storage.from('medya').getPublicUrl(fileName).data.publicUrl;
        }

        const { data: newPost, error: insertErr } = await supabase.from('gonderiler').insert([{ 
            user_id: currentUserSession.user.id, 
            gonderi_tipi: postType, 
            metin: portalPostText.value, 
            medya_url: finalMediaUrl 
        }]).select().single();
        
        if (insertErr) throw insertErr;

        // Takipçilere anında bildirim gönder (Optimistic & Realtime)
        const { data: followers } = await supabase.from('takipler').select('takip_eden_id').eq('takip_edilen_id', currentUserSession.user.id);
        if (followers && followers.length > 0) {
            const notifications = followers.map(f => ({
                alici_id: f.takip_eden_id,
                gonderen_id: currentUserSession.user.id,
                mesaj: 'yeni bir gönderi paylaştı.',
                gonderi_id: newPost.id
            }));
            await supabase.from('bildirimler').insert(notifications);
        }

        portalCreatePostModal.classList.add('hidden'); 
        portalCreatePostForm.reset(); 
        portalMediaUploadContainer.classList.add('hidden');
        loadFeed(currentFeedFilter);
    } catch (error) {
        Swal.fire({ icon: 'error', text: 'Gönderi paylaşılamadı.' });
    } finally { 
        portalSubmitPostBtn.innerHTML = 'Paylaş'; 
        portalSubmitPostBtn.disabled = false; 
    }
});

// Akış Filtreleri
portalFeedFilters.forEach(btn => {
    btn.addEventListener('click', (e) => {
        portalFeedFilters.forEach(f => f.className = "portal-feed-filter px-3 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200 text-xs font-semibold transition-colors");
        e.target.className = "portal-feed-filter active px-3 py-1 rounded-full bg-slate-800 text-white text-xs font-semibold transition-colors";
        currentFeedFilter = e.target.getAttribute('data-filter');
        loadFeed(currentFeedFilter);
    });
});

function generatePostHTML(post, isSingleView = false) {
    const author = post.yazar || {};
    const avatar = author.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.ad_soyad || 'U')}&background=1e3a8a&color=fff`;
    const likesCount = post.etkilesimler ? post.etkilesimler.length : 0;
    const isLikedByMe = post.etkilesimler ? post.etkilesimler.some(e => e.user_id === currentUserSession.user.id) : false;
    
    let postOptionsHTML = '';
    if (currentUserSession.user.id === post.user_id) {
        const canEdit = ((new Date() - new Date(post.created_at)) / (1000 * 60)) <= 15;
        postOptionsHTML = `
            <div class="relative group ml-auto">
                <button class="text-slate-400 p-2"><i class="fa-solid fa-ellipsis-vertical pointer-events-none"></i></button>
                <div class="absolute right-0 mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 overflow-hidden">
                    ${canEdit ? `<button class="edit-post-btn w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" data-post-id="${post.id}" data-text="${encodeURIComponent(post.metin)}">Düzenle</button>` : ''}
                    <button class="delete-post-btn w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50" data-post-id="${post.id}">Sil</button>
                </div>
            </div>
        `;
    }

    let commentsHTML = '';
    const allComments = post.gonderi_yorumlari || [];
    allComments.filter(c => !c.ust_yorum_id).forEach(comment => {
        const cAuthor = comment.yazar || {};
        const cAvatar = cAuthor.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(cAuthor.ad_soyad || 'U')}`;
        let cOptions = currentUserSession.user.id === comment.user_id ? `<button class="delete-comment-btn hover:text-red-500 ml-2" data-comment-id="${comment.id}">Sil</button>` : '';

        commentsHTML += `
            <div class="flex gap-2 items-start mt-4">
                <img src="${cAvatar}" class="w-8 h-8 rounded-full object-cover border border-slate-200 cursor-pointer user-profile-trigger" data-user-id="${comment.user_id}">
                <div class="flex-1">
                    <div class="bg-slate-100 px-3 py-1.5 rounded-xl inline-block">
                        <span class="font-bold text-[13px] text-slate-800 mr-2 cursor-pointer hover:underline user-profile-trigger" data-user-id="${comment.user_id}">${cAuthor.ad_soyad}</span>
                        <span class="text-sm text-slate-700">${comment.metin}</span>
                    </div>
                    <div class="flex gap-2 mt-0.5 ml-2 text-[11px] text-slate-400 font-semibold">
                        <button class="reply-to-comment-btn hover:text-slate-800" data-post-id="${post.id}" data-comment-id="${comment.id}" data-author-name="${cAuthor.ad_soyad}">Yanıtla</button>${cOptions}
                    </div>
        `;

        allComments.filter(r => r.ust_yorum_id === comment.id).forEach(reply => {
            const rAuthor = reply.yazar || {};
            const rAvatar = rAuthor.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(rAuthor.ad_soyad || 'U')}`;
            let rOptions = currentUserSession.user.id === reply.user_id ? `<button class="delete-comment-btn hover:text-red-500 ml-2" data-comment-id="${reply.id}">Sil</button>` : '';

            commentsHTML += `
                <div class="flex gap-2 items-start mt-2 ml-4 border-l-2 pl-2 border-slate-200">
                    <img src="${rAvatar}" class="w-6 h-6 rounded-full object-cover border border-slate-200 cursor-pointer user-profile-trigger" data-user-id="${reply.user_id}">
                    <div class="flex-1">
                        <div class="bg-slate-100 px-3 py-1.5 rounded-xl inline-block">
                            <span class="font-bold text-[12px] text-slate-800 mr-1 cursor-pointer hover:underline user-profile-trigger" data-user-id="${reply.user_id}">${rAuthor.ad_soyad}</span>
                            <span class="text-[13px] text-slate-700">${reply.metin}</span>
                        </div>
                        <div class="flex gap-2 mt-0.5 ml-2 text-[10px] text-slate-400 font-semibold">${rOptions}</div>
                    </div>
                </div>
            `;
        });
        commentsHTML += '</div></div>';
    });

    let mediaHTML = '';
    if (post.gonderi_tipi === 'medya' && post.medya_url) {
        if (post.medya_url.endsWith('.mp4')) {
            mediaHTML = `<video controls class="w-full h-auto max-h-96 object-cover bg-black mt-3 rounded-xl pointer-events-auto"><source src="${post.medya_url}"></video>`;
        } else {
            mediaHTML = `
                <div class="relative mt-3 rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                    <img src="${post.medya_url}" class="post-media-item w-full h-auto max-h-96 object-cover pointer-events-auto cursor-pointer" data-post-id="${post.id}" data-author-id="${post.user_id}">
                    <i class="fa-solid fa-heart absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-6xl opacity-0 pointer-events-none drop-shadow-md z-10" id="big-heart-${post.id}"></i>
                </div>
            `;
        }
    }

    return `
        <div id="post-${post.id}" class="post-card no-select bg-white p-5 rounded-2xl shadow-sm border border-slate-200 transition-all duration-300" data-post-id="${post.id}">
            <div class="flex justify-between items-start mb-3 pointer-events-auto">
                <div class="flex items-center gap-3">
                    <img src="${avatar}" class="w-11 h-11 rounded-full object-cover border border-slate-200 cursor-pointer user-profile-trigger" data-user-id="${post.user_id}">
                    <div>
                        <h4 class="font-bold text-slate-800 text-sm flex items-center gap-2 cursor-pointer hover:underline user-profile-trigger" data-user-id="${post.user_id}">
                            ${author.ad_soyad || 'Bilinmeyen'}
                            <span class="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] uppercase tracking-wide border border-blue-100">${author.rol || 'Müşteri'}</span>
                        </h4>
                        <p class="text-[11px] text-slate-400">${new Date(post.created_at).toLocaleDateString('tr-TR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</p>
                    </div>
                </div>
                ${postOptionsHTML}
            </div>
            
            <div class="text-slate-800 text-[15px] whitespace-pre-wrap pointer-events-auto">${post.metin}</div>
            ${mediaHTML}
            
            <div class="flex items-center gap-6 mt-4 pt-3 border-t border-slate-100 pointer-events-auto">
                <button class="action-btn like-btn flex items-center gap-2 text-sm font-semibold transition-colors ${isLikedByMe ? 'text-red-500' : 'text-slate-500 hover:text-red-500'}" data-post-id="${post.id}" data-author-id="${post.user_id}">
                    <i class="${isLikedByMe ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}" id="like-icon-${post.id}" style="pointer-events:none;"></i> <span style="pointer-events:none;" id="like-count-${post.id}">${likesCount > 0 ? likesCount : 'Beğen'}</span>
                </button>
                <button class="action-btn comment-toggle-btn flex items-center gap-2 text-slate-500 hover:text-blue-500 transition-colors text-sm font-semibold" data-post-id="${post.id}">
                    <i class="fa-regular fa-comment pointer-events-none"></i> <span class="pointer-events-none">${allComments.length > 0 ? allComments.length : 'Yorum Yap'}</span>
                </button>
            </div>

            <div class="comment-section ${isSingleView ? '' : 'hidden'} mt-4 pt-4 border-t border-slate-100 pointer-events-auto" id="comment-section-${post.id}">
                <div class="mb-4 space-y-1">${commentsHTML}</div>
                <div id="reply-indicator-${post.id}" class="hidden items-center justify-between bg-blue-50 text-blue-700 px-3 py-1.5 rounded-t-lg text-xs font-bold border border-blue-100 border-b-0">
                    <span><i class="fa-solid fa-reply mr-1"></i> <span id="reply-name-${post.id}"></span> kullanıcısına yanıt veriliyor</span>
                    <button class="cancel-reply-btn hover:text-red-500" data-post-id="${post.id}"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="flex gap-2">
                    <input type="text" id="comment-input-${post.id}" class="flex-1 px-4 py-2 bg-slate-100 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-colors" placeholder="Yorum ekle...">
                    <button class="submit-comment-btn w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-sm transition-colors" data-post-id="${post.id}" data-author-id="${post.user_id}">
                        <i class="fa-solid fa-paper-plane pointer-events-none text-sm"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function loadFeed(filterType) {
    if (!currentUserSession) return;
    portalFeedList.innerHTML = '<div class="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200"><i class="fa-solid fa-spinner fa-spin text-2xl mb-2"></i><p>Yükleniyor...</p></div>';
    try {
        let query = supabase.from('gonderiler').select(`*, yazar:uyeler(ad_soyad, avatar_url, rol), etkilesimler(id, user_id), gonderi_yorumlari(id, metin, created_at, user_id, ust_yorum_id, yazar:uyeler(ad_soyad, avatar_url, rol))`).order('created_at', { ascending: false });
        if (filterType !== 'all') query = query.eq('gonderi_tipi', filterType);
        const { data: posts } = await query;
        if (!posts || posts.length === 0) { portalFeedList.innerHTML = '<div class="bg-white p-8 border border-slate-200 rounded-xl text-center text-slate-500"><i class="fa-regular fa-folder-open text-3xl mb-2"></i><p>Henüz paylaşım yok.</p></div>'; return; }
        portalFeedList.innerHTML = '';
        posts.forEach(p => portalFeedList.insertAdjacentHTML('beforeend', generatePostHTML(p, false)));
    } catch (e) {}
}

// ETKİLEŞİM MOTORU (OPTIMISTIC UI - Global Click Listener)
document.addEventListener('click', async (e) => {
    if (!currentUserSession) return;
    const target = e.target;

    // BEĞENME (Anında Değişim)
    if (target.classList.contains('like-btn')) {
        const postId = target.getAttribute('data-post-id');
        const authorId = target.getAttribute('data-author-id');
        const icon = document.getElementById(`like-icon-${postId}`);
        const countSpan = document.getElementById(`like-count-${postId}`);
        const isLiked = icon.classList.contains('fa-solid');
        let currentCount = parseInt(countSpan.innerText) || 0;

        if (isLiked) {
            icon.className = "fa-regular fa-heart"; target.classList.replace('text-red-500', 'text-slate-500');
            countSpan.innerText = currentCount > 1 ? currentCount - 1 : 'Beğen';
        } else {
            icon.className = "fa-solid fa-heart text-red-500"; target.classList.replace('text-slate-500', 'text-red-500');
            countSpan.innerText = isNaN(currentCount) || currentCount === 0 ? 1 : currentCount + 1;
        }

        try {
            const { data: existingLike } = await supabase.from('etkilesimler').select('id').eq('gonderi_id', postId).eq('user_id', currentUserSession.user.id).single();
            if (existingLike) { await supabase.from('etkilesimler').delete().eq('id', existingLike.id); } 
            else {
                await supabase.from('etkilesimler').insert([{ gonderi_id: postId, user_id: currentUserSession.user.id, etkilesim_tipi: 'like' }]);
                if (authorId !== currentUserSession.user.id) await supabase.from('bildirimler').insert([{ alici_id: authorId, gonderen_id: currentUserSession.user.id, mesaj: 'Gönderini beğendi.', gonderi_id: postId }]);
            }
        } catch (err) {}
    }

    // YORUM ATMA
    if (target.classList.contains('submit-comment-btn')) {
        const postId = target.getAttribute('data-post-id');
        const authorId = target.getAttribute('data-author-id');
        const input = document.getElementById(`comment-input-${postId}`);
        if (!input.value.trim()) return;
        target.disabled = true; target.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        try {
            const parentId = activeReplyData[postId] || null;
            await supabase.from('gonderi_yorumlari').insert([{ gonderi_id: postId, user_id: currentUserSession.user.id, metin: input.value.trim(), ust_yorum_id: parentId }]);
            if (authorId !== currentUserSession.user.id) await supabase.from('bildirimler').insert([{ alici_id: authorId, gonderen_id: currentUserSession.user.id, mesaj: 'Gönderine yorum yaptı.', gonderi_id: postId }]);
            delete activeReplyData[postId]; input.value = '';
            
            const { data: post } = await supabase.from('gonderiler').select(`*, yazar:uyeler(ad_soyad, avatar_url, rol), etkilesimler(id, user_id), gonderi_yorumlari(id, metin, created_at, user_id, ust_yorum_id, yazar:uyeler(ad_soyad, avatar_url, rol))`).eq('id', postId).single();
            document.getElementById(`post-${postId}`).outerHTML = generatePostHTML(post, true);
        } catch(err) {} finally { target.disabled = false; target.innerHTML = '<i class="fa-solid fa-paper-plane text-sm"></i>'; }
    }

    if (target.classList.contains('comment-toggle-btn')) {
        document.getElementById(`comment-section-${target.getAttribute('data-post-id')}`).classList.toggle('hidden');
    }

    if (target.classList.contains('reply-to-comment-btn')) {
        const pId = target.getAttribute('data-post-id');
        activeReplyData[pId] = target.getAttribute('data-comment-id');
        document.getElementById(`reply-indicator-${pId}`).classList.replace('hidden', 'flex');
        document.getElementById(`reply-name-${pId}`).innerText = target.getAttribute('data-author-name');
        document.getElementById(`comment-input-${pId}`).focus();
    }

    if (target.classList.contains('cancel-reply-btn') || target.closest('.cancel-reply-btn')) {
        const pId = (target.getAttribute('data-post-id') || target.closest('.cancel-reply-btn').getAttribute('data-post-id'));
        delete activeReplyData[pId]; document.getElementById(`reply-indicator-${pId}`).classList.replace('flex', 'hidden');
    }

    // GÖNDERİ SİLME VE DÜZENLEME
    if (target.classList.contains('delete-post-btn')) {
        const postId = target.getAttribute('data-post-id');
        Swal.fire({
            title: 'Emin misin?', text: "Bu gönderiyi kalıcı olarak sileceksin!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Evet, Sil!', cancelButtonText: 'İptal'
        }).then(async (result) => {
            if (result.isConfirmed) { await supabase.from('gonderiler').delete().eq('id', postId); loadFeed(currentFeedFilter); closeSinglePostBtn.click(); }
        });
    }

    if (target.classList.contains('delete-comment-btn')) {
        const commentId = target.getAttribute('data-comment-id');
        Swal.fire({
            title: 'Yorumu Sil?', text: "Bu yorumu kalıcı olarak sileceksin!", icon: 'question', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Sil', cancelButtonText: 'İptal'
        }).then(async (result) => {
            if (result.isConfirmed) { await supabase.from('gonderi_yorumlari').delete().eq('id', commentId); loadFeed(currentFeedFilter); }
        });
    }

    if (target.classList.contains('edit-post-btn')) {
        const postId = target.getAttribute('data-post-id');
        const oldText = decodeURIComponent(target.getAttribute('data-text'));
        const { value: newText } = await Swal.fire({ input: 'textarea', inputValue: oldText, showCancelButton: true, confirmButtonText: 'Kaydet', cancelButtonText: 'İptal' });
        if (newText && newText !== oldText) { await supabase.from('gonderiler').update({ metin: newText }).eq('id', postId); loadFeed(currentFeedFilter); closeSinglePostBtn.click(); }
    }

    if (target.classList.contains('edit-comment-btn')) {
        const commentId = target.getAttribute('data-comment-id');
        const oldText = decodeURIComponent(target.getAttribute('data-text'));
        const { value: newText } = await Swal.fire({ input: 'text', inputValue: oldText, showCancelButton: true, confirmButtonText: 'Kaydet', cancelButtonText: 'İptal' });
        if (newText && newText !== oldText) { await supabase.from('gonderi_yorumlari').update({ metin: newText }).eq('id', commentId); loadFeed(currentFeedFilter); }
    }
});

// ÇİFT TIKLA GÖNDERİ BEĞENME (Insta Mantığı)
document.addEventListener('dblclick', async (e) => {
    if (!currentUserSession) return;
    const target = e.target;
    
    if (target.classList.contains('post-media-item')) {
        if (window.getSelection) window.getSelection().removeAllRanges();
        
        const postId = target.getAttribute('data-post-id');
        const authorId = target.getAttribute('data-author-id');
        
        const bigHeart = document.getElementById(`big-heart-${postId}`);
        if (bigHeart) {
            bigHeart.classList.remove('heart-pop');
            void bigHeart.offsetWidth;
            bigHeart.classList.add('heart-pop');
        }

        const icon = document.getElementById(`like-icon-${postId}`);
        const countSpan = document.getElementById(`like-count-${postId}`);
        const isLiked = icon.classList.contains('fa-solid');
        
        if (!isLiked) {
            let currentCount = parseInt(countSpan.innerText) || 0;
            icon.className = "fa-solid fa-heart text-red-500";
            document.querySelector(`.like-btn[data-post-id="${postId}"]`).classList.replace('text-slate-500', 'text-red-500');
            countSpan.innerText = isNaN(currentCount) || currentCount === 0 ? 1 : currentCount + 1;

            try {
                await supabase.from('etkilesimler').insert([{ gonderi_id: postId, user_id: currentUserSession.user.id, etkilesim_tipi: 'like' }]);
                if (authorId !== currentUserSession.user.id) {
                    await supabase.from('bildirimler').insert([{ alici_id: authorId, gonderen_id: currentUserSession.user.id, mesaj: 'Gönderini beğendi.', gonderi_id: postId }]);
                }
            } catch (err) {}
        }
    }
});

// UZUN BASMA (BEĞENENLERİ GÖR)
let timer;
['mousedown', 'touchstart'].forEach(e => document.addEventListener(e, (evt) => {
    const card = evt.target.closest('.post-card');
    if (card && !evt.target.closest('button') && !evt.target.closest('input')) {
        timer = setTimeout(() => showLikesModal(card.getAttribute('data-post-id')), 700);
    }
}));
['mouseup', 'mouseleave', 'touchend', 'touchmove'].forEach(e => document.addEventListener(e, () => clearTimeout(timer)));

async function showLikesModal(postId) {
    if (!postId) return; likesModal.classList.remove('hidden');
    likesList.innerHTML = '<p class="text-center text-slate-400 mt-4"><i class="fa-solid fa-spinner fa-spin text-xl mb-2"></i></p>';
    try {
        const { data } = await supabase.from('etkilesimler').select('user_id, uyeler(ad_soyad, avatar_url, rol)').eq('gonderi_id', postId).eq('etkilesim_tipi', 'like');
        if(!data || data.length === 0) { likesList.innerHTML = '<p class="text-center text-sm text-slate-500 mt-4">Beğeni yok.</p>'; return; }
        likesList.innerHTML = '';
        data.forEach(l => likesList.insertAdjacentHTML('beforeend', `<div class="flex items-center gap-3 p-2 border-b border-slate-100 cursor-pointer hover:bg-slate-50 user-profile-trigger" data-user-id="${l.user_id}" onclick="document.getElementById('close-likes-modal-btn').click();"><img src="${l.uyeler.avatar_url || 'https://via.placeholder.com/150'}" class="w-8 h-8 rounded-full object-cover pointer-events-none"><div class="pointer-events-none"><p class="font-bold text-sm text-slate-800">${l.uyeler.ad_soyad}</p></div></div>`));
    } catch (e) {}
}
closeLikesModalBtn.addEventListener('click', () => likesModal.classList.add('hidden'));

// ============================================================================
// INSTAGRAM PROFİLİ & TAKİP SİSTEMİ
// ============================================================================
tabGrid.addEventListener('click', () => {
    tabGrid.className = "flex-1 py-2.5 border-b-2 border-slate-800 text-slate-800 flex justify-center transition-all";
    tabQuestions.className = "flex-1 py-2.5 border-b-2 border-transparent text-slate-400 flex justify-center transition-all";
    upGrid.classList.remove('hidden'); upQuestionsList.classList.add('hidden');
});

tabQuestions.addEventListener('click', () => {
    tabQuestions.className = "flex-1 py-2.5 border-b-2 border-slate-800 text-slate-800 flex justify-center transition-all";
    tabGrid.className = "flex-1 py-2.5 border-b-2 border-transparent text-slate-400 flex justify-center transition-all";
    upGrid.classList.add('hidden'); upQuestionsList.classList.remove('hidden');
});

window.openUserProfile = async (uId) => {
    currentlyViewingProfileId = uId;
    userProfileModal.classList.remove('hidden'); 
    setTimeout(() => userProfileModal.classList.remove('translate-x-full'), 10);
    tabGrid.click();

    upGrid.innerHTML = '<div class="col-span-3 text-center p-10"><i class="fa-solid fa-spinner fa-spin text-2xl text-slate-400"></i></div>';
    upQuestionsList.innerHTML = '<div class="text-center p-10"><i class="fa-solid fa-spinner fa-spin text-2xl text-slate-400"></i></div>';

    try {
        const { data: user } = await supabase.from('uyeler').select('*').eq('id', uId).single();
        upHeaderName.innerText = user.ad_soyad; upName.innerText = user.ad_soyad; upRole.innerText = user.rol; upBio.innerText = user.biyografi || '';
        const userAvatar = user.avatar_url || 'https://via.placeholder.com/150';
        upAvatar.src = userAvatar;

        if (uId === currentUserSession.user.id) { 
            followBtn.classList.add('hidden'); unfollowBtn.classList.add('hidden'); messageUserBtn.classList.add('hidden');
        } else {
            messageUserBtn.classList.remove('hidden');
            messageUserBtn.onclick = () => {
                userProfileModal.classList.add('translate-x-full');
                setTimeout(() => userProfileModal.classList.add('hidden'), 300);
                openChat(uId, user.ad_soyad, userAvatar);
            };

            const { data: follow } = await supabase.from('takipler').select('id').eq('takip_eden_id', currentUserSession.user.id).eq('takip_edilen_id', uId).single();
            if (follow) { followBtn.classList.add('hidden'); unfollowBtn.classList.remove('hidden'); } 
            else { unfollowBtn.classList.add('hidden'); followBtn.classList.remove('hidden'); }
        }

        const { count: fer } = await supabase.from('takipler').select('*', { count: 'exact', head: true }).eq('takip_edilen_id', uId);
        const { count: fing } = await supabase.from('takipler').select('*', { count: 'exact', head: true }).eq('takip_eden_id', uId);
        upFollowerCount.innerText = fer || 0; upFollowingCount.innerText = fing || 0;

        const { data: posts } = await supabase.from('gonderiler').select(`*, yazar:uyeler(ad_soyad, avatar_url, rol), etkilesimler(id, user_id), gonderi_yorumlari(id, metin, created_at, user_id, ust_yorum_id, yazar:uyeler(ad_soyad, avatar_url, rol))`).eq('user_id', uId).order('created_at', { ascending: false });
        upPostCount.innerText = posts ? posts.length : 0;
        upGrid.innerHTML = ''; upQuestionsList.innerHTML = '';

        if(posts) {
            posts.forEach(p => {
                if (p.gonderi_tipi === 'medya') {
                    let content = p.medya_url.endsWith('.mp4') ? '<div class="absolute inset-0 bg-black flex items-center justify-center text-white"><i class="fa-solid fa-play"></i></div>' : `<img src="${p.medya_url}" class="w-full h-full object-cover">`;
                    upGrid.insertAdjacentHTML('beforeend', `<div class="aspect-square relative cursor-pointer border border-white" onclick="openSinglePost(${p.id})">${content}</div>`);
                } 
                else { upQuestionsList.insertAdjacentHTML('beforeend', generatePostHTML(p, false)); }
            });
            if(upGrid.innerHTML === '') upGrid.innerHTML = '<div class="col-span-3 text-center p-10 text-sm text-slate-400">Medya gönderisi yok.</div>';
            if(upQuestionsList.innerHTML === '') upQuestionsList.innerHTML = '<p class="text-center text-sm text-slate-400 p-10">Soru gönderisi yok.</p>';
        }
    } catch(e) {}
};

document.addEventListener('click', async (e) => {
    const trig = e.target.closest('.user-profile-trigger');
    if (!trig) return;
    const uId = trig.getAttribute('data-user-id');
    if (uId) openUserProfile(uId);
});

closeUserProfileBtn.addEventListener('click', () => { userProfileModal.classList.add('translate-x-full'); setTimeout(() => userProfileModal.classList.add('hidden'), 300); });

followBtn.addEventListener('click', async () => {
    await supabase.from('takipler').insert([{ takip_eden_id: currentUserSession.user.id, takip_edilen_id: currentlyViewingProfileId }]);
    await supabase.from('bildirimler').insert([{ alici_id: currentlyViewingProfileId, gonderen_id: currentUserSession.user.id, mesaj: 'Seni takip etmeye başladı.' }]);
    followBtn.classList.add('hidden'); unfollowBtn.classList.remove('hidden'); upFollowerCount.innerText = parseInt(upFollowerCount.innerText)+1;
});
unfollowBtn.addEventListener('click', async () => {
    await supabase.from('takipler').delete().eq('takip_eden_id', currentUserSession.user.id).eq('takip_edilen_id', currentlyViewingProfileId);
    unfollowBtn.classList.add('hidden'); followBtn.classList.remove('hidden'); upFollowerCount.innerText = parseInt(upFollowerCount.innerText)-1;
});

// --- TEKİL GÖNDERİ MODALI ---
window.openSinglePost = async (postId) => {
    singlePostModal.classList.remove('hidden'); setTimeout(() => singlePostModal.classList.remove('translate-x-full'), 10);
    singlePostContainer.innerHTML = '<div class="text-center mt-20"><i class="fa-solid fa-spinner fa-spin text-3xl text-slate-400 mb-2"></i></div>';
    try {
        const { data: post } = await supabase.from('gonderiler').select(`*, yazar:uyeler(ad_soyad, avatar_url, rol), etkilesimler(id, user_id), gonderi_yorumlari(id, metin, created_at, user_id, ust_yorum_id, yazar:uyeler(ad_soyad, avatar_url, rol))`).eq('id', postId).single();
        singlePostContainer.innerHTML = generatePostHTML(post, true);
    } catch (e) {}
};
closeSinglePostBtn.addEventListener('click', () => { singlePostModal.classList.add('translate-x-full'); setTimeout(() => singlePostModal.classList.add('hidden'), 300); });

// ============================================================================
// DM MESAJLAŞMA (INBOX & SOHBET EKRANI)
// ============================================================================
async function checkMessagesBadge() {
    if (!currentUserSession) return;
    try {
        const { count } = await supabase.from('mesajlar').select('*', { count: 'exact', head: true }).eq('alici_id', currentUserSession.user.id).eq('okundu', false);
        if (count > 0) messagesBadge.classList.remove('hidden'); else messagesBadge.classList.add('hidden');
    } catch (error) {}
}

portalMessagesBtn.addEventListener('click', () => {
    messagesListModal.classList.remove('hidden');
    setTimeout(() => messagesListModal.classList.remove('translate-x-full'), 10);
    loadConversations();
});

closeMessagesListModalBtn.addEventListener('click', () => {
    messagesListModal.classList.add('translate-x-full');
    setTimeout(() => messagesListModal.classList.add('hidden'), 300);
});

async function loadConversations() {
    conversationsList.innerHTML = '<div class="text-center text-slate-400 mt-10"><i class="fa-solid fa-spinner fa-spin text-2xl mb-2"></i></div>';
    try {
        const { data: msgs, error } = await supabase.from('mesajlar').select('*, gonderen:uyeler!gonderen_id(id, ad_soyad, avatar_url), alici:uyeler!alici_id(id, ad_soyad, avatar_url)').or(`gonderen_id.eq.${currentUserSession.user.id},alici_id.eq.${currentUserSession.user.id}`).order('created_at', { ascending: false });
        if (error) throw error;
        if (!msgs || msgs.length === 0) { conversationsList.innerHTML = '<p class="text-center mt-10 text-slate-500 text-sm">Mesaj kutunuz boş.</p>'; return; }

        const convos = {};
        msgs.forEach(m => {
            const isMeSender = m.gonderen_id === currentUserSession.user.id;
            const otherUser = isMeSender ? m.alici : m.gonderen;
            if (!convos[otherUser.id]) {
                convos[otherUser.id] = { user: otherUser, lastMsg: m.metin || '📷 Görsel', date: new Date(m.created_at), isUnread: !isMeSender && !m.okundu, senderLabel: isMeSender ? 'Sen: ' : '' };
            }
        });

        conversationsList.innerHTML = '';
        Object.values(convos).forEach(c => {
            const avatar = c.user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user.ad_soyad)}`;
            const bgClass = c.isUnread ? 'bg-blue-50 border-blue-100' : 'bg-white border-white hover:bg-slate-50';
            const textWeight = c.isUnread ? 'font-bold text-slate-800' : 'font-medium text-slate-500';
            
            conversationsList.insertAdjacentHTML('beforeend', `
                <div class="p-3 flex items-center gap-3 cursor-pointer transition-colors border-b ${bgClass}" onclick="openChat('${c.user.id}', '${c.user.ad_soyad}', '${avatar}')">
                    <img src="${avatar}" class="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-slate-200">
                    <div class="flex-1 overflow-hidden">
                        <div class="font-bold text-sm text-slate-800">${c.user.ad_soyad}</div>
                        <div class="text-[13px] truncate mt-0.5 ${textWeight}">${c.senderLabel}${c.lastMsg}</div>
                    </div>
                    ${c.isUnread ? '<span class="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>' : ''}
                </div>
            `);
        });
    } catch (error) { conversationsList.innerHTML = '<p class="text-center text-red-500 mt-10">Yüklenemedi.</p>'; }
}

window.openChat = async (targetId, targetName, targetAvatar) => {
    currentChatUserId = targetId;
    chatDmName.innerText = targetName; chatDmAvatar.src = targetAvatar;
    chatDmAvatar.setAttribute('data-user-id', targetId); chatDmName.setAttribute('data-user-id', targetId);
    
    chatModalDm.classList.remove('hidden'); setTimeout(() => chatModalDm.classList.remove('translate-x-full'), 10);
    chatDmHistory.innerHTML = '<div class="flex-1 flex items-center justify-center"><i class="fa-solid fa-spinner fa-spin text-2xl text-slate-400"></i></div>';

    try {
        await supabase.from('mesajlar').update({ okundu: true }).eq('alici_id', currentUserSession.user.id).eq('gonderen_id', targetId).eq('okundu', false);
        checkMessagesBadge();
        if(!messagesListModal.classList.contains('hidden')) loadConversations();

        const { data: history, error } = await supabase
            .from('mesajlar')
            .select('*')
            .in('gonderen_id', [currentUserSession.user.id, targetId])
            .in('alici_id', [currentUserSession.user.id, targetId])
            .order('created_at', { ascending: true });

        if (error) throw error;

        chatDmHistory.innerHTML = '';
        if (history && history.length > 0) {
            history.forEach(msg => appendMessageToUI(msg, msg.gonderen_id === currentUserSession.user.id));
        } else {
            chatDmHistory.innerHTML = '<p id="empty-chat-msg" class="text-center text-slate-400 mt-10 text-sm">İlk mesajı sen gönder!</p>';
        }
        scrollToChatBottom();
    } catch (error) { 
        chatDmHistory.innerHTML = '<p class="text-center text-red-500 mt-10">Sohbet yüklenemedi.</p>'; 
    }
};

function appendMessageToUI(msg, isMine) {
    const emptyMsg = document.getElementById('empty-chat-msg');
    if (emptyMsg) emptyMsg.remove();

    const timeStr = new Date(msg.created_at).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});
    const mediaHtml = msg.medya_url ? `<img src="${msg.medya_url}" class="w-full max-w-[200px] h-auto rounded-lg mb-1 pointer-events-none">` : '';
    const textHtml = (msg.metin && msg.metin !== '📷 Görsel') ? `<div class="whitespace-pre-wrap leading-relaxed">${msg.metin}</div>` : '';
    
    const readHtml = isMine ? `<i class="msg-read-status fa-solid ${msg.okundu ? 'fa-check-double text-blue-500' : 'fa-check text-slate-400'} ml-1"></i>` : '';
    const heartClass = msg.begendi ? 'scale-100 opacity-100' : 'scale-0 opacity-0';

    if (isMine) {
        chatDmHistory.insertAdjacentHTML('beforeend', `
            <div class="flex flex-col items-end w-full animate-fade-in relative mb-3" id="msg-wrapper-${msg.id}">
                <div class="msg-bubble relative bg-blue-600 text-white px-4 py-2.5 rounded-2xl rounded-br-sm max-w-[75%] text-[14px] shadow-sm cursor-pointer select-none" data-msg-id="${msg.id}" data-is-mine="true" data-is-liked="${!!msg.begendi}">
                    ${mediaHtml}
                    ${textHtml}
                    <div class="msg-heart absolute -bottom-2 -left-2 bg-slate-800 rounded-full w-6 h-6 flex items-center justify-center shadow-md border-2 border-white transition-all duration-300 ${heartClass}"><i class="fa-solid fa-heart text-red-500 text-[11px]"></i></div>
                </div>
                <div class="flex items-center text-[10px] text-slate-400 mt-1 mr-1"><span>${timeStr}</span>${readHtml}</div>
            </div>
        `);
    } else {
        chatDmHistory.insertAdjacentHTML('beforeend', `
            <div class="flex items-end gap-2 w-full animate-fade-in relative mb-3" id="msg-wrapper-${msg.id}">
                <img src="${chatDmAvatar.src}" class="w-7 h-7 rounded-full object-cover mb-4 border border-slate-200">
                <div class="flex flex-col items-start w-full">
                    <div class="msg-bubble relative bg-white border border-slate-200 text-slate-800 px-4 py-2.5 rounded-2xl rounded-bl-sm max-w-[75%] text-[14px] shadow-sm cursor-pointer select-none" data-msg-id="${msg.id}" data-is-mine="false" data-is-liked="${!!msg.begendi}">
                        ${mediaHtml}
                        ${textHtml}
                        <div class="msg-heart absolute -bottom-2 -right-2 bg-slate-800 rounded-full w-6 h-6 flex items-center justify-center shadow-md border-2 border-white transition-all duration-300 ${heartClass}"><i class="fa-solid fa-heart text-red-500 text-[11px]"></i></div>
                    </div>
                    <span class="text-[10px] text-slate-400 mt-1 ml-1">${timeStr}</span>
                </div>
            </div>
        `);
    }
    scrollToChatBottom();
}

function scrollToChatBottom() { chatDmHistory.scrollTop = chatDmHistory.scrollHeight; }

closeChatDmBtn.addEventListener('click', () => {
    currentChatUserId = null;
    chatModalDm.classList.add('translate-x-full'); setTimeout(() => chatModalDm.classList.add('hidden'), 300);
});

chatDmInput.addEventListener('input', () => {
    if(currentChatUserId && chatBroadcastChannel) {
        chatBroadcastChannel.send({ type: 'broadcast', event: 'typing', payload: { from: currentUserSession.user.id, to: currentChatUserId } });
    }
});

chatDmForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = chatDmInput.value.trim();
    if (!currentChatUserId || !text) return;
    chatDmInput.value = ''; 
    
    try {
        const { error } = await supabase.from('mesajlar').insert([{ gonderen_id: currentUserSession.user.id, alici_id: currentChatUserId, metin: text }]);
        if (error) throw error;
        if(!messagesListModal.classList.contains('hidden')) loadConversations();
    } catch (err) { Swal.fire({ icon: 'error', title: 'Hata', text: 'Mesaj iletilemedi.' }); }
});

chatDmMediaInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if(!file || !currentChatUserId) return;
    e.target.value = ''; 
    
    chatDmHistory.insertAdjacentHTML('beforeend', `<div class="text-center text-xs text-slate-400 my-2" id="img-upload-loading">Fotoğraf gönderiliyor...</div>`);
    scrollToChatBottom();

    try {
        const ext = file.name.split('.').pop();
        const fileName = `dm-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('medya').upload(fileName, file);
        if(uploadError) throw uploadError;
        
        const finalMediaUrl = supabase.storage.from('medya').getPublicUrl(fileName).data.publicUrl;
        await supabase.from('mesajlar').insert([{ gonderen_id: currentUserSession.user.id, alici_id: currentChatUserId, metin: '📷 Görsel', medya_url: finalMediaUrl }]);
    } catch(err) {
        Swal.fire({icon:'error', text:'Görsel gönderilemedi'});
    } finally {
        const loader = document.getElementById('img-upload-loading');
        if(loader) loader.remove();
    }
});

let msgPressTimer;
chatDmHistory.addEventListener('mousedown', handleMsgPressStart);
chatDmHistory.addEventListener('touchstart', handleMsgPressStart);
chatDmHistory.addEventListener('mouseup', handleMsgPressEnd);
chatDmHistory.addEventListener('mouseleave', handleMsgPressEnd);
chatDmHistory.addEventListener('touchend', handleMsgPressEnd);
chatDmHistory.addEventListener('touchmove', handleMsgPressEnd);

function handleMsgPressStart(e) {
    const bubble = e.target.closest('.msg-bubble');
    if(bubble) {
        const msgId = bubble.getAttribute('data-msg-id');
        const isMine = bubble.getAttribute('data-is-mine') === 'true';
        msgPressTimer = setTimeout(() => {
            if(isMine) {
                Swal.fire({title: 'Mesajı Sil?', icon: 'warning', showCancelButton:true, confirmButtonText:'Sil', cancelButtonText:'İptal', confirmButtonColor: '#d33'}).then(async res => {
                    if(res.isConfirmed) {
                        const wrapper = document.getElementById(`msg-wrapper-${msgId}`);
                        if(wrapper) {
                            wrapper.style.opacity = '0';
                            setTimeout(() => wrapper.remove(), 200);
                        }
                        await supabase.from('mesajlar').delete().eq('id', msgId);
                    }
                })
            }
        }, 600); 
    }
}
function handleMsgPressEnd() { clearTimeout(msgPressTimer); }

chatDmHistory.addEventListener('dblclick', async (e) => {
    const bubble = e.target.closest('.msg-bubble');
    if(bubble) {
        if(window.getSelection) window.getSelection().removeAllRanges();
        const msgId = bubble.getAttribute('data-msg-id');
        const isLiked = bubble.getAttribute('data-is-liked') === 'true';
        
        bubble.setAttribute('data-is-liked', (!isLiked).toString());
        const heart = bubble.querySelector('.msg-heart');
        
        if(!isLiked) { 
            heart.classList.remove('scale-0', 'opacity-0');
            heart.classList.add('scale-100', 'opacity-100', 'chat-heart-anim');
        } else { 
            heart.classList.remove('scale-100', 'opacity-100', 'chat-heart-anim');
            heart.classList.add('scale-0', 'opacity-0');
        }

        await supabase.from('mesajlar').update({begendi: !isLiked}).eq('id', msgId);
    }
});

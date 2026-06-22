import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// ============================================
// SUPABASE BAĞLANTISI (Öz Social İçin)
// ============================================
const supabaseUrl = "https://ppdwtpjglkphayfxexhv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwZHd0cGpnbGtwaGF5ZnhleGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNTc5ODEsImV4cCI6MjA5NjgzMzk4MX0.fJIyyxfU15EgrNARWkISFHJvU7-o-QpZbIKbRc3q_-s";
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// ANA SİTE MANTIĞI (DİL, KARTELA, CHATBOT)
// ============================================
let currentLang = 'tr';

const langTrBtn = document.getElementById('lang-tr');
const langEnBtn = document.getElementById('lang-en');

function applyLanguage(lang) {
    currentLang = lang;
    if(langTrBtn && langEnBtn) {
        langTrBtn.classList.toggle('active', lang === 'tr');
        langEnBtn.classList.toggle('active', lang === 'en');
    }

    document.querySelectorAll('[data-tr]').forEach(el => {
        const text = lang === 'tr' ? el.getAttribute('data-tr') : el.getAttribute('data-en');
        if (text) {
            if (text.includes('<') && text.includes('>')) {
                el.innerHTML = text;
            } else {
                el.textContent = text;
            }
        }
    });

    document.querySelectorAll('[data-tr-placeholder]').forEach(el => {
        const ph = lang === 'tr' ? el.getAttribute('data-tr-placeholder') : el.getAttribute('data-en-placeholder');
        if (ph) el.placeholder = ph;
    });

    const botChatInput = document.getElementById('chat-input');
    if (botChatInput) {
        botChatInput.placeholder = lang === 'tr' ? 'Mesajınızı yazın...' : 'Type your message...';
    }

    renderColors();
    fetchApprovedReviews();
    document.documentElement.lang = lang === 'tr' ? 'tr' : 'en';
}

if(langTrBtn) langTrBtn.addEventListener('click', () => applyLanguage('tr'));
if(langEnBtn) langEnBtn.addEventListener('click', () => applyLanguage('en'));

// --- Asistan Chatbot ---
const openChatBtn = document.getElementById('open-chatbot');
const botChatModal = document.getElementById('chat-modal');
const closeChatBtn = document.getElementById('close-chat');
const botChatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');
const chatMessages = document.getElementById('chat-messages');
let botChatInitialized = false;

const addMessage = (text, type) => {
    const div = document.createElement('div');
    div.className = `msg msg-${type}`;
    div.textContent = text;
    if(chatMessages) {
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
};

const showTypingIndicator = () => {
    const div = document.createElement('div');
    div.className = 'typing-indicator';
    div.innerHTML = `<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>`;
    if(chatMessages) {
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    return div;
};

if(openChatBtn) {
    openChatBtn.onclick = () => {
        botChatModal.style.display = 'flex';
        if (!botChatInitialized) {
            botChatInitialized = true;
            const typingEl = showTypingIndicator();
            setTimeout(() => {
                if(typingEl) typingEl.remove();
                addMessage(
                    currentLang === 'tr' ? 'Merhaba! Ben Öz Yapı Market asistanı. Boya, tesisat veya bataryalarımız hakkında size nasıl yardımcı olabilirim?' : 'Hello! I am the Öz Yapı Market assistant. How can I help you about our paints, plumbing or batteries?', 
                    'bot'
                );
            }, 1500);
        }
    };
}
if(closeChatBtn) closeChatBtn.onclick = () => botChatModal.style.display = 'none';

const handleSend = async () => {
    if(!botChatInput) return;
    const val = botChatInput.value.trim();
    if (!val) return;
    
    addMessage(val, 'user');
    botChatInput.value = '';
    const typingEl = showTypingIndicator();

    try {
        const res = await fetch("/api/chat", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: "Ziyaretçi", message: val })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        
        if(typingEl) typingEl.remove();
        addMessage(data.reply || (currentLang === 'tr' ? "Cevap alınamadı" : "No response received"), 'bot');
    } catch (e) {
        if(typingEl) typingEl.remove();
        addMessage(currentLang === 'tr' ? "Bağlantı hatası oluştu, lütfen tekrar deneyin." : "Connection error, please try again.", 'bot');
    }
};

if(chatSend) chatSend.onclick = handleSend;
if(botChatInput) botChatInput.onkeypress = (e) => { if(e.key === 'Enter') handleSend(); };

// --- Kartela & PDF ---
const openModalBtn = document.getElementById('open-kartela-btn');
const kartelaModal = document.getElementById('kartela-modal');
const closeKartelaBtn = document.getElementById('close-modal');
const colorGrid = document.getElementById('modal-color-grid');
const colorSearch = document.getElementById('color-search');
const filterBtns = document.querySelectorAll('.filter-btn');

const openPdfBtn = document.getElementById('open-pdf-btn');
const pdfModal = document.getElementById('pdf-modal');
const closePdfModalBtn = document.getElementById('close-pdf-modal');

if(openPdfBtn) {
    openPdfBtn.onclick = () => { kartelaModal.style.display = 'none'; pdfModal.style.display = 'flex'; };
}
if(closePdfModalBtn) {
    closePdfModalBtn.onclick = () => { pdfModal.style.display = 'none'; kartelaModal.style.display = 'flex'; };
}

let activeFilter = 'all'; let searchTerm = '';

function renderColors() {
    if(!colorGrid) return;
    colorGrid.innerHTML = '';
    if (typeof colorList === 'undefined') return;

    const filtered = colorList.filter(color => {
        const matchesSearch = color.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = activeFilter === 'all' || color.type === activeFilter;
        return matchesSearch && matchesType;
    });

    const typeLabel = currentLang === 'tr' ? { ic: 'İç Cephe', dis: 'Dış Cephe' } : { ic: 'Interior', dis: 'Exterior' };

    filtered.forEach(color => {
        const item = document.createElement('div');
        item.className = 'color-item';
        item.innerHTML = `
            <div class="swatch-preview" style="background-color: ${color.hex}"></div>
            <span>${color.name}</span>
            <div style="font-size:0.6rem; color:#9ca3af; margin-top:4px;">${typeLabel[color.type]}</div>
        `;
        colorGrid.appendChild(item);
    });
}

if(colorSearch) {
    colorSearch.addEventListener('input', (e) => { searchTerm = e.target.value; renderColors(); });
}

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => { b.classList.remove('active'); b.style.background = 'rgba(255,255,255,0.05)'; });
        btn.classList.add('active');
        activeFilter = btn.getAttribute('data-type');
        renderColors();
    });
});

if(openModalBtn) openModalBtn.onclick = () => { kartelaModal.style.display = 'flex'; renderColors(); };
if(closeKartelaBtn) closeKartelaBtn.onclick = () => kartelaModal.style.display = 'none';

// --- Yorum Sistemi ---
const reviewModal = document.getElementById('review-modal');
const openReviewBtn = document.getElementById('open-review-modal');
const closeReviewBtn = document.getElementById('close-review-modal');

if (openReviewBtn) openReviewBtn.onclick = () => reviewModal.style.display = 'flex';
if (closeReviewBtn) closeReviewBtn.onclick = () => reviewModal.style.display = 'none';

let selectedRating = 0;
document.querySelectorAll('#star-rating-container .review-star').forEach(star => {
    star.addEventListener('click', function() {
        selectedRating = parseInt(this.getAttribute('data-value')); updateStarDisplay(selectedRating);
    });
    star.addEventListener('mouseover', function() {
        const hoverValue = parseInt(this.getAttribute('data-value')); updateStarDisplay(hoverValue);
    });
});
document.getElementById('star-rating-container')?.addEventListener('mouseleave', () => updateStarDisplay(selectedRating));

function updateStarDisplay(value) {
    document.querySelectorAll('#star-rating-container .review-star').forEach(star => {
        const starValue = parseInt(star.getAttribute('data-value'));
        star.style.color = starValue <= value ? '#f59e0b' : '#cbd5e1';
    });
}

async function fetchApprovedReviews() {
    const grid = document.getElementById('dynamic-testimonials-list');
    if (!grid) return;
    try {
        const res = await fetch('/api/reviews');
        const reviews = await res.json();
        if(!reviews || reviews.length === 0) {
            grid.innerHTML = currentLang === 'tr' ? `<p style="text-align:center; grid-column: 1/-1; color: var(--text-light);">Henüz yorum yapılmamış. İlk yorumu siz yapın!</p>` : `<p style="text-align:center; grid-column: 1/-1; color: var(--text-light);">No reviews yet. Be the first to write a review!</p>`;
            return;
        }
        grid.innerHTML = '';
        reviews.forEach(r => {
            const firstLetter = r.ad_soyad ? r.ad_soyad.charAt(0).toUpperCase() : 'M';
            grid.innerHTML += `
                <div class="testimonial-card">
                    <i class="fa-solid fa-quote-right quote-icon"></i>
                    <div class="stars">${'<i class="fa-solid fa-star"></i>'.repeat(r.puan)}${`<i class="fa-regular fa-star" style="color:#cbd5e1"></i>`.repeat(5 - r.puan)}</div>
                    <p>"${r.yorum_metni}"</p>
                    <div class="client-info">
                        <div class="client-avatar" style="background: var(--primary-color); color:white; display:flex; align-items:center; justify-content:center; font-weight:bold;">${firstLetter}</div>
                        <div><h4>${r.ad_soyad}</h4><span style="font-size: 0.8rem; color: var(--text-light);">${r.kategori}</span></div>
                    </div>
                </div>`;
        });
    } catch (e) {}
}

const reviewForm = document.getElementById('user-review-form');
if(reviewForm) {
    reviewForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        if(selectedRating === 0) { alert(currentLang === 'tr' ? "Lütfen bir yıldız puanı seçiniz." : "Please select a star rating."); return; }
        const payload = {
            ad_soyad: document.getElementById('rev-name').value, kategori: document.getElementById('rev-category').value,
            puan: selectedRating, yorum_metni: document.getElementById('rev-text').value
        };
        try {
            const res = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            if(data.success) {
                alert(currentLang === 'tr' ? "Teşekkürler! Yorumunuz yönetici onayından sonra yayınlanacaktır." : "Thank you! Your review will be published after admin approval.");
                reviewForm.reset(); selectedRating = 0; updateStarDisplay(0); reviewModal.style.display = 'none';
            } else { alert("Hata / Error: " + data.error); }
        } catch(err) {
            alert(currentLang === 'tr' ? "Sistemde bir arıza oluştu, lütfen daha sonra tekrar deneyin." : "A system error occurred, please try again later.");
        }
    });
}

// --- UI GENEL EFEKTLERİ ---
window.onclick = (e) => { 
    if(e.target == kartelaModal) kartelaModal.style.display = 'none'; 
    if(e.target == botChatModal) botChatModal.style.display = 'none';
    if(e.target == pdfModal) pdfModal.style.display = 'none';
    if(e.target == reviewModal) reviewModal.style.display = 'none'; 
}

const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const navLinks = document.getElementById('nav-links');
const navLinksItems = document.querySelectorAll('.nav-links a');

if(mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = mobileMenuBtn.querySelector('i');
        icon.classList.toggle('fa-bars'); icon.classList.toggle('fa-xmark');
    });
}

navLinksItems.forEach(item => {
    item.addEventListener('click', () => {
        if(navLinks) navLinks.classList.remove('active');
        if(mobileMenuBtn) mobileMenuBtn.querySelector('i').className = 'fa-solid fa-bars';
    });
});

const navbar = document.getElementById('navbar');
const sections = document.querySelectorAll('section');

window.addEventListener('scroll', () => {
    if(navbar) navbar.classList.toggle('scrolled', window.scrollY > 50);
    let current = '';
    sections.forEach(section => { if (pageYOffset >= (section.offsetTop - 200)) current = section.getAttribute('id'); });
    navLinksItems.forEach(a => {
        a.classList.remove('active');
        if (a.getAttribute('href')?.includes(current)) a.classList.add('active');
    });
});

const reveals = document.querySelectorAll('.reveal');
const revealOnScroll = () => {
    reveals.forEach(reveal => { if (reveal.getBoundingClientRect().top < window.innerHeight - 150) reveal.classList.add('active'); });
}
window.addEventListener('scroll', revealOnScroll);
revealOnScroll();

const swatches = document.querySelectorAll('.color-swatch');
const displayBox = document.getElementById('selected-color-box');
const displayName = document.getElementById('selected-color-name');
const displayHex = document.getElementById('selected-color-hex');

swatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
        swatches.forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
        const hexColor = swatch.getAttribute('data-hex');
        if(displayBox) displayBox.style.backgroundColor = hexColor;
        if(displayName) displayName.textContent = swatch.getAttribute('data-name');
        if(displayHex) displayHex.textContent = hexColor;
    });
});

document.addEventListener('DOMContentLoaded', fetchApprovedReviews);


// ============================================
// ÖZ SOCIAL (BETA) & AUTH SİSTEMİ BİRLEŞİMİ
// ============================================

// Elementler (Auth Modalı)
const authModalWrapper = document.getElementById('auth-modal-wrapper');
const closeAuthModalBtn = document.getElementById('close-auth-modal');
const navLoginBtn = document.getElementById('nav-login-btn');
const navRegisterBtn = document.getElementById('nav-register-btn');
const navAuthBtnsContainer = document.getElementById('nav-auth-buttons');
const profileFabContainer = document.getElementById('profile-fab-container');
const profileFabBtn = document.getElementById('profile-fab-btn');
const fabAvatar = document.getElementById('fab-avatar');

// Form Elementleri
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const forgotPasswordForm = document.getElementById('forgot-password-form');
const resetPasswordForm = document.getElementById('reset-password-form');
const showRegisterBtn = document.getElementById('show-register');
const showLoginBtn = document.getElementById('show-login');
const showForgotPasswordBtn = document.getElementById('show-forgot-password');
const backToLoginBtn = document.getElementById('back-to-login');

// Social Dashboard Elementleri
const socialDashboardModal = document.getElementById('social-dashboard-modal');
const closeSocialDashboardBtn = document.getElementById('close-social-dashboard');
const logoutBtn = document.getElementById('logout-btn');
const dashboardView = document.getElementById('dashboard-view');
const editProfileForm = document.getElementById('edit-profile-form');
const editProfileBtn = document.getElementById('edit-profile-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const editAvatarInput = document.getElementById('edit-avatar');
const editAvatarImg = document.getElementById('edit-avatar-img');
const editNameInput = document.getElementById('edit-name');
const editBioInput = document.getElementById('edit-bio');
const avatarInput = document.getElementById('reg-avatar');
const avatarPreview = document.getElementById('avatar-preview');

// Social Feed & Action Elementleri
const feedList = document.getElementById('feed-list');
const feedFilters = document.querySelectorAll('.feed-filter');
const openCreatePostBtn = document.getElementById('open-create-post');
const createPostModal = document.getElementById('create-post-modal');
const closePostModalBtn = document.getElementById('close-post-modal');
const createPostForm = document.getElementById('create-post-form');
const postTypeRadios = document.getElementsByName('post_type');
const mediaUploadContainer = document.getElementById('media-upload-container');
const postMediaInput = document.getElementById('post-media');
const postTextInput = document.getElementById('post-text');
const submitPostBtn = document.getElementById('submit-post-btn');

// Notification & Messages Elementleri
const notificationBtn = document.getElementById('notification-btn');
const notificationBadge = document.getElementById('notification-badge');
const notificationModal = document.getElementById('notification-modal');
const closeNotificationModalBtn = document.getElementById('close-notification-modal');
const notificationList = document.getElementById('notification-list');

const messagesBtn = document.getElementById('messages-btn');
const messagesBadge = document.getElementById('messages-badge');
const messagesListModal = document.getElementById('messages-list-modal');
const closeMessagesListModalBtn = document.getElementById('close-messages-list-modal');
const conversationsList = document.getElementById('conversations-list');

// DM Chat Elementleri
const dmModal = document.getElementById('dm-modal');
const closeDmBtn = document.getElementById('close-dm-btn');
const dmHistory = document.getElementById('chat-history');
const dmForm = document.getElementById('dm-form');
const dmInput = document.getElementById('dm-input');
const dmMediaInput = document.getElementById('chat-media-input');
const dmTypingIndicator = document.getElementById('chat-typing-indicator');
const dmUserAvatar = document.getElementById('chat-user-avatar');
const dmUserName = document.getElementById('chat-user-name');

// Profile Modals & Follow Actions
const userProfileModal = document.getElementById('user-profile-modal');
const closeUserProfileBtn = document.getElementById('close-user-profile');
const upHeaderName = document.getElementById('up-header-name');
const upAvatar = document.getElementById('up-avatar');
const upPostCount = document.getElementById('up-post-count');
const upFollowerCount = document.getElementById('up-follower-count');
const upFollowingCount = document.getElementById('up-following-count');
const upName = document.getElementById('up-name');
const upRole = document.getElementById('up-role');
const upBio = document.getElementById('up-bio');
const followBtn = document.getElementById('follow-btn');
const unfollowBtn = document.getElementById('unfollow-btn');
const messageUserBtn = document.getElementById('message-user-btn');

// Diğer Social Modallar
const likesModal = document.getElementById('likes-modal');
const closeLikesModalBtn = document.getElementById('close-likes-modal');
const singlePostModal = document.getElementById('single-post-modal');
const closeSinglePostBtn = document.getElementById('close-single-post');
const singlePostContainer = document.getElementById('single-post-container');

// State Değişkenleri
let currentUserSession = null;
let currentFeedFilter = 'all';
let activeReplyData = {}; 
let selectedAvatarFile = null;
let selectedUpdateAvatarFile = null;
let currentlyViewingProfileId = null;
let currentChatUserId = null; 
let realtimeChannel = null;
let chatBroadcastChannel = null;
let typingTimeout;

// --- Auth Modal Açılışları ---
function openAuthModal(formType) {
    if(authModalWrapper) {
        authModalWrapper.classList.remove('hidden');
        authModalWrapper.classList.add('flex');
        [loginForm, registerForm, forgotPasswordForm, resetPasswordForm].forEach(f => f?.classList.add('hidden'));
        if(formType === 'login') loginForm.classList.remove('hidden');
        if(formType === 'register') registerForm.classList.remove('hidden');
    }
}
if(navLoginBtn) navLoginBtn.addEventListener('click', () => openAuthModal('login'));
if(navRegisterBtn) navRegisterBtn.addEventListener('click', () => openAuthModal('register'));
if(closeAuthModalBtn) {
    closeAuthModalBtn.addEventListener('click', () => {
        authModalWrapper.classList.add('hidden'); authModalWrapper.classList.remove('flex');
    });
}
if(profileFabBtn) {
    profileFabBtn.addEventListener('click', () => {
        socialDashboardModal.classList.remove('hidden'); socialDashboardModal.classList.add('flex');
        document.body.style.overflow = 'hidden'; // Scroll Fix: Arka sitenin kaymasını engeller
        loadFeed(currentFeedFilter);
    });
}
if(closeSocialDashboardBtn) {
    closeSocialDashboardBtn.addEventListener('click', () => {
        socialDashboardModal.classList.add('hidden'); socialDashboardModal.classList.remove('flex');
        document.body.style.overflow = ''; // Scroll Fix: Ana sitenin kaymasını geri açar
    });
}

function toggleAuthForms(activeForm) {
    [loginForm, registerForm, forgotPasswordForm, resetPasswordForm].forEach(f => f?.classList.add('hidden'));
    if(activeForm) activeForm.classList.remove('hidden');
}

if(avatarInput) {
    avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            selectedAvatarFile = file;
            const reader = new FileReader();
            reader.onload = (e) => avatarPreview.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover">`;
            reader.readAsDataURL(file);
        }
    });
}

if(showRegisterBtn) showRegisterBtn.addEventListener('click', (e) => { e.preventDefault(); toggleAuthForms(registerForm); });
if(showLoginBtn) showLoginBtn.addEventListener('click', (e) => { e.preventDefault(); toggleAuthForms(loginForm); });
if(showForgotPasswordBtn) showForgotPasswordBtn.addEventListener('click', (e) => { e.preventDefault(); toggleAuthForms(forgotPasswordForm); });
if(backToLoginBtn) backToLoginBtn.addEventListener('click', (e) => { e.preventDefault(); toggleAuthForms(loginForm); });

if(registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const role = document.getElementById('reg-role').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const btn = document.getElementById('register-btn');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> İşlem Yapılıyor...'; btn.disabled = true;
        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
            if (authError) throw authError;

            let finalAvatarUrl = null;
            if (selectedAvatarFile && authData.user) {
                const ext = selectedAvatarFile.name.split('.').pop();
                const fileName = `${authData.user.id}-${Math.random()}.${ext}`;
                const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, selectedAvatarFile);
                if (!uploadError) finalAvatarUrl = supabase.storage.from('avatars').getPublicUrl(fileName).data.publicUrl;
            }

            if (authData.user) await supabase.from('uyeler').insert([{ id: authData.user.id, ad_soyad: name, rol: role, avatar_url: finalAvatarUrl, biyografi: "" }]);
            Swal.fire({ icon: 'success', title: 'Başarılı', text: 'Kayıt olundu, giriş yapabilirsiniz.' });
            registerForm.reset(); selectedAvatarFile = null;
            avatarPreview.innerHTML = '<i class="fa-solid fa-camera text-2xl text-slate-400 group-hover:text-blue-500 transition-colors"></i>';
            toggleAuthForms(loginForm);
        } catch (error) { Swal.fire({ icon: 'error', title: 'Hata', text: error.message }); }
        finally { btn.innerHTML = 'Kayıt Ol'; btn.disabled = false; }
    });
}

if(loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const btn = document.getElementById('login-btn');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Bekleyin...'; btn.disabled = true;
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            loginForm.reset();
            authModalWrapper.classList.add('hidden');
            checkSession();
        } catch (error) { Swal.fire({ icon: 'error', title: 'Başarısız', text: "E-posta veya şifre hatalı!" }); }
        finally { btn.innerHTML = 'Giriş Yap'; btn.disabled = false; }
    });
}

if(forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgot-email').value;
        const btn = document.getElementById('forgot-btn');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Gönderiliyor...'; btn.disabled = true;
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
            if (error) throw error;
            Swal.fire({ icon: 'success', title: 'Gönderildi', text: 'Bağlantı iletildi.' });
            forgotPasswordForm.reset(); toggleAuthForms(loginForm);
        } catch (error) { Swal.fire({ icon: 'error', title: 'Hata', text: error.message }); }
        finally { btn.innerHTML = 'Gönder'; btn.disabled = false; }
    });
}

if(resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('new-password').value;
        const btn = document.getElementById('reset-btn');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Güncelleniyor...'; btn.disabled = true;
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            Swal.fire({ icon: 'success', title: 'Başarılı', text: 'Şifre güncellendi!', timer: 1500, showConfirmButton: false });
            resetPasswordForm.reset(); checkSession();
        } catch (error) { Swal.fire({ icon: 'error', title: 'Hata', text: error.message }); }
        finally { btn.innerHTML = 'Güncelle'; btn.disabled = false; }
    });
}

if(editProfileBtn) {
    editProfileBtn.addEventListener('click', () => {
        dashboardView.classList.add('hidden'); editProfileForm.classList.remove('hidden');
        editNameInput.value = document.getElementById('dash-name').innerText;
        editBioInput.value = document.getElementById('dash-bio').innerText;
        editAvatarImg.src = document.getElementById('dash-avatar').src;
        selectedUpdateAvatarFile = null;
    });
}

if(cancelEditBtn) cancelEditBtn.addEventListener('click', () => { editProfileForm.classList.add('hidden'); dashboardView.classList.remove('hidden'); });

if(editAvatarInput) {
    editAvatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            selectedUpdateAvatarFile = file;
            const reader = new FileReader();
            reader.onload = (e) => editAvatarImg.src = e.target.result;
            reader.readAsDataURL(file);
        }
    });
}

if(editProfileForm) {
    editProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('save-edit-btn');
        btn.innerHTML = 'Kaydediliyor...'; btn.disabled = true;
        try {
            let updatedAvatarUrl = null;
            if (selectedUpdateAvatarFile) {
                const ext = selectedUpdateAvatarFile.name.split('.').pop();
                const fileName = `${currentUserSession.user.id}-${Math.random()}.${ext}`;
                await supabase.storage.from('avatars').upload(fileName, selectedUpdateAvatarFile);
                updatedAvatarUrl = supabase.storage.from('avatars').getPublicUrl(fileName).data.publicUrl;
            }
            const updateData = { ad_soyad: editNameInput.value, biyografi: editBioInput.value };
            if (updatedAvatarUrl) updateData.avatar_url = updatedAvatarUrl;
            await supabase.from('uyeler').update(updateData).eq('id', currentUserSession.user.id);
            
            editProfileForm.classList.add('hidden'); dashboardView.classList.remove('hidden');
            checkSession();
        } catch (error) { Swal.fire({ icon: 'error', title: 'Hata', text: error.message }); }
        finally { btn.innerHTML = 'Kaydet'; btn.disabled = false; }
    });
}

if(logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        if (realtimeChannel) supabase.removeChannel(realtimeChannel);
        if (chatBroadcastChannel) supabase.removeChannel(chatBroadcastChannel);
        await supabase.auth.signOut();
        socialDashboardModal.classList.add('hidden');
        document.body.style.overflow = ''; // Scroll Fix Restore
        checkSession();
    });
}

// --- Session & Realtime Yönetimi ---
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        currentUserSession = session;
        if(navAuthBtnsContainer) navAuthBtnsContainer.classList.add('hidden');
        if(profileFabContainer) { profileFabContainer.classList.remove('hidden'); profileFabContainer.classList.add('flex'); }
        
        const dashEmailEl = document.getElementById('dash-email');
        if(dashEmailEl) dashEmailEl.innerText = session.user.email;

        try {
            const { data: userData } = await supabase.from('uyeler').select('*').eq('id', session.user.id).single();
            if (userData) {
                const nameText = userData.ad_soyad || 'İsimsiz';
                const avatarUrl = userData.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(nameText)}&background=1e3a8a&color=fff`;
                
                document.getElementById('dash-name').innerText = nameText;
                document.getElementById('dash-role').innerText = userData.rol || 'KULLANICI';
                document.getElementById('dash-bio').innerText = userData.biyografi || '';
                document.getElementById('dash-avatar').src = avatarUrl;
                document.getElementById('dash-my-profile-trigger').setAttribute('data-user-id', session.user.id);
                document.getElementById('dash-name').setAttribute('data-user-id', session.user.id);
                
                if(fabAvatar) fabAvatar.src = avatarUrl;
            }
        } catch (e) {}
        
        checkNotificationsBadge(); checkMessagesBadge(); setupRealtime();
    } else {
        currentUserSession = null;
        if (realtimeChannel) { supabase.removeChannel(realtimeChannel); realtimeChannel = null; }
        if (chatBroadcastChannel) { supabase.removeChannel(chatBroadcastChannel); chatBroadcastChannel = null; }
        
        if(navAuthBtnsContainer) navAuthBtnsContainer.classList.remove('hidden');
        if(profileFabContainer) { profileFabContainer.classList.add('hidden'); profileFabContainer.classList.remove('flex'); }
    }
}
document.addEventListener('DOMContentLoaded', checkSession);

function setupRealtime() {
    if (realtimeChannel) return;
    realtimeChannel = supabase.channel('oz-yapi-realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'gonderiler' }, async (payload) => {
            if (payload.new.user_id !== currentUserSession?.user?.id) {
                const { data: newPost } = await supabase.from('gonderiler').select(`*, yazar:uyeler(ad_soyad, avatar_url, rol), etkilesimler(id, user_id), gonderi_yorumlari(id, metin, created_at, user_id, ust_yorum_id, yazar:uyeler(ad_soyad, avatar_url, rol))`).eq('id', payload.new.id).single();
                if (newPost && (currentFeedFilter === 'all' || currentFeedFilter === newPost.gonderi_tipi)) {
                    if (feedList) feedList.insertAdjacentHTML('afterbegin', generatePostHTML(newPost, false));
                }
            }
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bildirimler' }, (payload) => {
            if (payload.new.alici_id === currentUserSession?.user?.id && notificationBadge) notificationBadge.classList.remove('hidden');
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'mesajlar' }, (payload) => {
            const isRelatedToMe = payload.new?.alici_id === currentUserSession?.user?.id || payload.new?.gonderen_id === currentUserSession?.user?.id || payload.old?.gonderen_id === currentUserSession?.user?.id;
            if (isRelatedToMe) {
                if (payload.eventType === 'INSERT') {
                    if (currentChatUserId === payload.new.gonderen_id || currentChatUserId === payload.new.alici_id) {
                        const isMine = payload.new.gonderen_id === currentUserSession.user.id;
                        appendMessageToUI(payload.new, isMine);
                        if (!isMine) supabase.from('mesajlar').update({okundu: true}).eq('id', payload.new.id).then(()=>{}); 
                    } else if (payload.new.alici_id === currentUserSession.user.id) {
                        checkMessagesBadge();
                        if (messagesListModal && !messagesListModal.classList.contains('hidden')) loadConversations();
                    }
                } 
                else if (payload.eventType === 'UPDATE') {
                    const bubbleWrapper = document.getElementById(`msg-wrapper-${payload.new.id}`);
                    if (bubbleWrapper) {
                        const bubble = bubbleWrapper.querySelector('.msg-bubble');
                        const heart = bubbleWrapper.querySelector('.msg-heart');
                        if(bubble) bubble.setAttribute('data-is-liked', payload.new.begendi.toString());
                        if (payload.new.begendi) {
                            heart.classList.remove('scale-0', 'opacity-0'); heart.classList.add('scale-100', 'opacity-100');
                        } else {
                            heart.classList.remove('scale-100', 'opacity-100'); heart.classList.add('scale-0', 'opacity-0');
                        }
                        const readIcon = bubbleWrapper.querySelector('.msg-read-status');
                        if (readIcon && payload.new.okundu) readIcon.className = 'msg-read-status fa-solid fa-check-double text-blue-500 ml-1';
                    }
                    if (messagesListModal && !messagesListModal.classList.contains('hidden')) loadConversations();
                } 
                else if (payload.eventType === 'DELETE') {
                    const wrapper = document.getElementById(`msg-wrapper-${payload.old.id}`);
                    if(wrapper) wrapper.remove();
                    if (messagesListModal && !messagesListModal.classList.contains('hidden')) loadConversations();
                }
            }
        }).subscribe();

    if(!chatBroadcastChannel) {
        chatBroadcastChannel = supabase.channel('chat-typing');
        chatBroadcastChannel.on('broadcast', { event: 'typing' }, payload => {
            if (payload.payload.to === currentUserSession.user.id && payload.payload.from === currentChatUserId && dmModal && !dmModal.classList.contains('hidden')) {
                if(dmTypingIndicator) {
                    dmTypingIndicator.classList.remove('hidden'); dmTypingIndicator.classList.add('flex');
                    scrollToChatBottom(); clearTimeout(typingTimeout);
                    typingTimeout = setTimeout(() => { dmTypingIndicator.classList.remove('flex'); dmTypingIndicator.classList.add('hidden'); }, 2000);
                }
            }
        }).subscribe();
    }
}

// --- Bildirimler ---
async function checkNotificationsBadge() {
    if (!currentUserSession || !notificationBadge) return;
    try {
        const { count } = await supabase.from('bildirimler').select('*', { count: 'exact', head: true }).eq('alici_id', currentUserSession.user.id).eq('okundu', false);
        if (count > 0) notificationBadge.classList.remove('hidden'); else notificationBadge.classList.add('hidden');
    } catch (error) {}
}

if(notificationBtn) {
    notificationBtn.addEventListener('click', async () => {
        notificationModal.classList.remove('hidden'); 
        // Blur Fix: Wrapper yerine ilk çocuğu kaydırıyoruz
        setTimeout(() => notificationModal.firstElementChild.classList.remove('translate-x-full'), 10);
        notificationList.innerHTML = '<div class="text-center text-slate-400 mt-10"><i class="fa-solid fa-spinner fa-spin text-2xl mb-2"></i></div>';
        try {
            const { data: notifications } = await supabase.from('bildirimler').select('*, gonderen:uyeler!gonderen_id(ad_soyad, avatar_url)').eq('alici_id', currentUserSession.user.id).order('created_at', { ascending: false }).limit(20);
            if (!notifications || notifications.length === 0) { notificationList.innerHTML = '<p class="text-center mt-10 text-slate-500">Bildirim yok.</p>'; return; }
            notificationList.innerHTML = '';
            notifications.forEach(notif => {
                const sender = notif.gonderen || {};
                const avatar = sender.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(sender.ad_soyad || 'U')}`;
                const dotClass = notif.okundu ? 'hidden' : 'block';
                const postIdParam = notif.gonderi_id ? `'${notif.gonderi_id}'` : 'null';
                const senderIdParam = notif.gonderen_id ? `'${notif.gonderen_id}'` : 'null';

                notificationList.insertAdjacentHTML('beforeend', `
                    <div class="p-3 rounded-xl flex items-start gap-3 relative cursor-pointer hover:bg-slate-100 bg-white border border-slate-100 ${notif.okundu ? '' : 'bg-blue-50/60'}" onclick="handleNotificationClick(${notif.id}, ${postIdParam}, ${senderIdParam})">
                        <span class="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full ${dotClass}"></span>
                        <img src="${avatar}" class="w-10 h-10 rounded-full object-cover flex-shrink-0">
                        <div class="flex-1 text-sm text-slate-800"><span class="font-bold">${sender.ad_soyad}</span> ${notif.mesaj}</div>
                    </div>
                `);
            });
        } catch (error) {}
    });
}

if(closeNotificationModalBtn) {
    closeNotificationModalBtn.addEventListener('click', () => { 
        notificationModal.firstElementChild.classList.add('translate-x-full'); 
        setTimeout(() => notificationModal.classList.add('hidden'), 300); 
        checkNotificationsBadge(); 
    });
}

window.handleNotificationClick = async (notificationId, postId, senderId) => {
    await supabase.from('bildirimler').update({ okundu: true }).eq('id', notificationId);
    notificationModal.firstElementChild.classList.add('translate-x-full'); 
    setTimeout(() => notificationModal.classList.add('hidden'), 300); 
    checkNotificationsBadge();
    if (postId && postId !== 'null' && postId !== 'undefined') openSinglePost(postId);
    else if (senderId && senderId !== 'null') openUserProfile(senderId);
};

// --- Mesajlaşma Sistemi ---
async function checkMessagesBadge() {
    if (!currentUserSession || !messagesBadge) return;
    try {
        const { count } = await supabase.from('mesajlar').select('*', { count: 'exact', head: true }).eq('alici_id', currentUserSession.user.id).eq('okundu', false);
        if (count > 0) messagesBadge.classList.remove('hidden'); else messagesBadge.classList.add('hidden');
    } catch (error) {}
}

if(messagesBtn) {
    messagesBtn.addEventListener('click', () => {
        messagesListModal.classList.remove('hidden'); 
        // Blur Fix: Wrapper yerine ilk çocuğu kaydırıyoruz
        setTimeout(() => messagesListModal.firstElementChild.classList.remove('translate-x-full'), 10);
        loadConversations();
    });
}

if(closeMessagesListModalBtn) {
    closeMessagesListModalBtn.addEventListener('click', () => { 
        messagesListModal.firstElementChild.classList.add('translate-x-full'); 
        setTimeout(() => messagesListModal.classList.add('hidden'), 300); 
    });
}

async function loadConversations() {
    if(!conversationsList) return;
    conversationsList.innerHTML = '<div class="text-center text-slate-400 mt-10"><i class="fa-solid fa-spinner fa-spin text-2xl mb-2"></i></div>';
    try {
        const { data: msgs, error } = await supabase.from('mesajlar').select('*, gonderen:uyeler!gonderen_id(id, ad_soyad, avatar_url), alici:uyeler!alici_id(id, ad_soyad, avatar_url)').or(`gonderen_id.eq.${currentUserSession.user.id},alici_id.eq.${currentUserSession.user.id}`).order('created_at', { ascending: false });
        if (error) throw error;
        if (!msgs || msgs.length === 0) { conversationsList.innerHTML = '<p class="text-center mt-10 text-slate-500">Mesaj kutunuz boş.</p>'; return; }

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
            const bgClass = c.isUnread ? 'bg-blue-50 border-blue-100' : 'bg-white border-white';
            const textWeight = c.isUnread ? 'font-bold text-slate-800' : 'font-normal text-slate-500';
            
            conversationsList.insertAdjacentHTML('beforeend', `
                <div class="p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors border-b ${bgClass}" onclick="openChat('${c.user.id}', '${c.user.ad_soyad}', '${avatar}')">
                    <img src="${avatar}" class="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-slate-200">
                    <div class="flex-1 overflow-hidden">
                        <div class="font-bold text-[14px] text-slate-800">${c.user.ad_soyad}</div>
                        <div class="text-[13px] truncate mt-0.5 ${textWeight}">${c.senderLabel}${c.lastMsg}</div>
                    </div>
                    ${c.isUnread ? '<span class="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>' : ''}
                </div>
            `);
        });
    } catch (error) {}
}

window.openChat = async (targetId, targetName, targetAvatar) => {
    currentChatUserId = targetId;
    if(dmUserName) dmUserName.innerText = targetName; 
    if(dmUserAvatar) dmUserAvatar.src = targetAvatar;
    if(dmUserAvatar) dmUserAvatar.setAttribute('data-user-id', targetId); 
    if(dmUserName) dmUserName.setAttribute('data-user-id', targetId);
    
    if(dmModal) { dmModal.classList.remove('hidden'); setTimeout(() => dmModal.classList.remove('translate-x-full'), 10); }
    if(dmHistory) dmHistory.innerHTML = '<div class="flex-1 flex items-center justify-center"><i class="fa-solid fa-spinner fa-spin text-2xl text-slate-400"></i></div>';

    try {
        await supabase.from('mesajlar').update({ okundu: true }).eq('alici_id', currentUserSession.user.id).eq('gonderen_id', targetId).eq('okundu', false);
        checkMessagesBadge();
        if(messagesListModal && !messagesListModal.classList.contains('hidden')) loadConversations();

        const { data: history, error } = await supabase.from('mesajlar').select('*').in('gonderen_id', [currentUserSession.user.id, targetId]).in('alici_id', [currentUserSession.user.id, targetId]).order('created_at', { ascending: true });
        if (error) throw error;

        if(dmHistory) dmHistory.innerHTML = '';
        if (history && history.length > 0) {
            history.forEach(msg => appendMessageToUI(msg, msg.gonderen_id === currentUserSession.user.id));
        } else {
            if(dmHistory) dmHistory.innerHTML = '<p id="empty-chat-msg" class="text-center text-slate-400 mt-10 text-sm">İlk mesajı sen gönder!</p>';
        }
        scrollToChatBottom();
    } catch (error) { if(dmHistory) dmHistory.innerHTML = '<p class="text-center text-red-500 mt-10">Sohbet yüklenemedi.</p>'; }
};

function appendMessageToUI(msg, isMine) {
    const emptyMsg = document.getElementById('empty-chat-msg');
    if (emptyMsg) emptyMsg.remove();
    if (!dmHistory) return;

    const timeStr = new Date(msg.created_at).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});
    const mediaHtml = msg.medya_url ? `<img src="${msg.medya_url}" class="w-full max-w-[200px] h-auto rounded-lg mb-1 pointer-events-none">` : '';
    const textHtml = (msg.metin && msg.metin !== '📷 Görsel') ? `<div class="whitespace-pre-wrap leading-relaxed">${msg.metin}</div>` : '';
    const readHtml = isMine ? `<i class="msg-read-status fa-solid ${msg.okundu ? 'fa-check-double text-blue-500' : 'fa-check text-slate-400'} ml-1"></i>` : '';
    const heartClass = msg.begendi ? 'scale-100 opacity-100' : 'scale-0 opacity-0';

    if (isMine) {
        dmHistory.insertAdjacentHTML('beforeend', `
            <div class="flex flex-col items-end w-full animate-fade-in relative mb-3" id="msg-wrapper-${msg.id}">
                <div class="msg-bubble relative bg-blue-600 text-white px-4 py-2.5 rounded-2xl rounded-br-sm max-w-[75%] text-[14px] shadow-sm cursor-pointer select-none" data-msg-id="${msg.id}" data-is-mine="true" data-is-liked="${!!msg.begendi}">
                    ${mediaHtml}${textHtml}
                    <div class="msg-heart absolute -bottom-2 -left-2 bg-slate-800 rounded-full w-6 h-6 flex items-center justify-center shadow-md border-2 border-white transition-all duration-300 ${heartClass}"><i class="fa-solid fa-heart text-red-500 text-[11px]"></i></div>
                </div>
                <div class="flex items-center text-[10px] text-slate-400 mt-1 mr-1"><span>${timeStr}</span>${readHtml}</div>
            </div>
        `);
    } else {
        const avatarSrc = dmUserAvatar ? dmUserAvatar.src : '';
        dmHistory.insertAdjacentHTML('beforeend', `
            <div class="flex items-end gap-2 w-full animate-fade-in relative mb-3" id="msg-wrapper-${msg.id}">
                <img src="${avatarSrc}" class="w-7 h-7 rounded-full object-cover mb-4 border border-slate-200">
                <div class="flex flex-col items-start w-full">
                    <div class="msg-bubble relative bg-white border border-slate-200 text-slate-800 px-4 py-2.5 rounded-2xl rounded-bl-sm max-w-[75%] text-[14px] shadow-sm cursor-pointer select-none" data-msg-id="${msg.id}" data-is-mine="false" data-is-liked="${!!msg.begendi}">
                        ${mediaHtml}${textHtml}
                        <div class="msg-heart absolute -bottom-2 -right-2 bg-slate-800 rounded-full w-6 h-6 flex items-center justify-center shadow-md border-2 border-white transition-all duration-300 ${heartClass}"><i class="fa-solid fa-heart text-red-500 text-[11px]"></i></div>
                    </div>
                    <span class="text-[10px] text-slate-400 mt-1 ml-1">${timeStr}</span>
                </div>
            </div>
        `);
    }
    scrollToChatBottom();
}

function scrollToChatBottom() { if(dmHistory) dmHistory.scrollTop = dmHistory.scrollHeight; }

if(closeDmBtn) {
    closeDmBtn.addEventListener('click', () => {
        currentChatUserId = null;
        dmModal.classList.add('translate-x-full'); setTimeout(() => dmModal.classList.add('hidden'), 300);
    });
}

if(dmInput) {
    dmInput.addEventListener('input', () => {
        if(currentChatUserId && chatBroadcastChannel) {
            chatBroadcastChannel.send({ type: 'broadcast', event: 'typing', payload: { from: currentUserSession.user.id, to: currentChatUserId } });
        }
    });
}

if(dmForm) {
    dmForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = dmInput.value.trim();
        if (!currentChatUserId || !text) return;
        dmInput.value = ''; 
        try {
            const { error } = await supabase.from('mesajlar').insert([{ gonderen_id: currentUserSession.user.id, alici_id: currentChatUserId, metin: text }]);
            if (error) throw error;
            if(messagesListModal && !messagesListModal.classList.contains('hidden')) loadConversations();
        } catch (err) { Swal.fire({ icon: 'error', title: 'Hata', text: 'Mesaj iletilemedi.' }); }
    });
}

if(dmMediaInput) {
    dmMediaInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if(!file || !currentChatUserId || !dmHistory) return;
        e.target.value = ''; 
        dmHistory.insertAdjacentHTML('beforeend', `<div class="text-center text-xs text-slate-400 my-2" id="img-upload-loading">Fotoğraf gönderiliyor...</div>`);
        scrollToChatBottom();
        try {
            const ext = file.name.split('.').pop();
            const fileName = `dm-${Date.now()}.${ext}`;
            const { error: uploadError } = await supabase.storage.from('medya').upload(fileName, file);
            if(uploadError) throw uploadError;
            const finalMediaUrl = supabase.storage.from('medya').getPublicUrl(fileName).data.publicUrl;
            await supabase.from('mesajlar').insert([{ gonderen_id: currentUserSession.user.id, alici_id: currentChatUserId, metin: '📷 Görsel', medya_url: finalMediaUrl }]);
        } catch(err) { Swal.fire({icon:'error', text:'Görsel gönderilemedi'}); } 
        finally { const loader = document.getElementById('img-upload-loading'); if(loader) loader.remove(); }
    });
}

if(dmHistory) {
    let msgPressTimer;
    const handleMsgPressStart = (e) => {
        const bubble = e.target.closest('.msg-bubble');
        if(bubble) {
            const msgId = bubble.getAttribute('data-msg-id');
            const isMine = bubble.getAttribute('data-is-mine') === 'true';
            msgPressTimer = setTimeout(() => {
                if(isMine) {
                    Swal.fire({title: 'Mesajı Sil?', icon: 'warning', showCancelButton:true, confirmButtonText:'Sil', cancelButtonText:'İptal', confirmButtonColor: '#d33'}).then(async res => {
                        if(res.isConfirmed) {
                            const wrapper = document.getElementById(`msg-wrapper-${msgId}`);
                            if(wrapper) { wrapper.style.opacity = '0'; setTimeout(() => wrapper.remove(), 200); }
                            await supabase.from('mesajlar').delete().eq('id', msgId);
                        }
                    })
                }
            }, 600); 
        }
    };
    const handleMsgPressEnd = () => clearTimeout(msgPressTimer);
    dmHistory.addEventListener('mousedown', handleMsgPressStart);
    dmHistory.addEventListener('touchstart', handleMsgPressStart);
    dmHistory.addEventListener('mouseup', handleMsgPressEnd);
    dmHistory.addEventListener('mouseleave', handleMsgPressEnd);
    dmHistory.addEventListener('touchend', handleMsgPressEnd);
    dmHistory.addEventListener('touchmove', handleMsgPressEnd);

    dmHistory.addEventListener('dblclick', async (e) => {
        const bubble = e.target.closest('.msg-bubble');
        if(bubble) {
            if(window.getSelection) window.getSelection().removeAllRanges();
            const msgId = bubble.getAttribute('data-msg-id');
            const isLiked = bubble.getAttribute('data-is-liked') === 'true';
            bubble.setAttribute('data-is-liked', (!isLiked).toString());
            const heart = bubble.querySelector('.msg-heart');
            if(!isLiked) { 
                heart.classList.remove('scale-0', 'opacity-0'); heart.classList.add('scale-100', 'opacity-100', 'chat-heart-anim');
            } else { 
                heart.classList.remove('scale-100', 'opacity-100', 'chat-heart-anim'); heart.classList.add('scale-0', 'opacity-0');
            }
            await supabase.from('mesajlar').update({begendi: !isLiked}).eq('id', msgId);
        }
    });
}

// --- Sosyal Medya Dashboard Post ve Akış ---
if(postTypeRadios) {
    postTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if(e.target.value === 'medya') { if(mediaUploadContainer) mediaUploadContainer.classList.remove('hidden'); }
            else { if(mediaUploadContainer) mediaUploadContainer.classList.add('hidden'); if(postMediaInput) postMediaInput.value = ''; }
        });
    });
}

if(openCreatePostBtn) openCreatePostBtn.addEventListener('click', () => { if(createPostModal) createPostModal.classList.remove('hidden'); });
if(closePostModalBtn) closePostModalBtn.addEventListener('click', () => { if(createPostModal) createPostModal.classList.add('hidden'); if(createPostForm) createPostForm.reset(); if(mediaUploadContainer) mediaUploadContainer.classList.add('hidden'); });

if(createPostForm) {
    createPostForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitPostBtn.innerHTML = 'Paylaşılıyor...'; submitPostBtn.disabled = true;
        try {
            let finalMediaUrl = null;
            if (document.querySelector('input[name="post_type"]:checked').value === 'medya' && postMediaInput.files[0]) {
                const file = postMediaInput.files[0];
                const ext = file.name.split('.').pop();
                const fileName = `post-${Date.now()}.${ext}`;
                await supabase.storage.from('medya').upload(fileName, file);
                finalMediaUrl = supabase.storage.from('medya').getPublicUrl(fileName).data.publicUrl;
            }

            const { data: newPost, error: insertErr } = await supabase.from('gonderiler').insert([{ user_id: currentUserSession.user.id, gonderi_tipi: document.querySelector('input[name="post_type"]:checked').value, metin: postTextInput.value, medya_url: finalMediaUrl }]).select().single();
            if (insertErr) throw insertErr;

            const { data: followers } = await supabase.from('takipler').select('takip_eden_id').eq('takip_edilen_id', currentUserSession.user.id);
            if (followers && followers.length > 0) {
                const notifications = followers.map(f => ({ alici_id: f.takip_eden_id, gonderen_id: currentUserSession.user.id, mesaj: 'yeni bir gönderi paylaştı.', gonderi_id: newPost.id }));
                await supabase.from('bildirimler').insert(notifications);
            }

            createPostModal.classList.add('hidden'); createPostForm.reset(); mediaUploadContainer.classList.add('hidden');
            loadFeed(currentFeedFilter);
        } catch (error) {} finally { submitPostBtn.innerHTML = 'Paylaş'; submitPostBtn.disabled = false; }
    });
}

if(feedFilters) {
    feedFilters.forEach(btn => {
        btn.addEventListener('click', (e) => {
            feedFilters.forEach(f => f.className = "feed-filter px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold shadow-sm outline-none");
            e.target.className = "feed-filter active px-4 py-1.5 rounded-full bg-slate-800 text-white text-sm font-semibold transition-colors border-none outline-none";
            currentFeedFilter = e.target.getAttribute('data-filter');
            loadFeed(currentFeedFilter);
        });
    });
}

// Buton Çizgi Fix: Tüm interaktif butonlara border-none ve bg-transparent eklendi
function generatePostHTML(post, isSingleView = false) {
    const author = post.yazar || {};
    const avatar = author.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.ad_soyad || 'U')}&background=1e3a8a&color=fff`;
    const likesCount = post.etkilesimler ? post.etkilesimler.length : 0;
    const isLikedByMe = post.etkilesimler && currentUserSession ? post.etkilesimler.some(e => e.user_id === currentUserSession.user.id) : false;
    
    let postOptionsHTML = '';
    if (currentUserSession && currentUserSession.user.id === post.user_id) {
        const canEdit = ((new Date() - new Date(post.created_at)) / (1000 * 60)) <= 15;
        postOptionsHTML = `
            <div class="relative group ml-auto">
                <button class="text-slate-400 p-2 border-none bg-transparent outline-none"><i class="fa-solid fa-ellipsis-vertical pointer-events-none"></i></button>
                <div class="absolute right-0 mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 overflow-hidden">
                    ${canEdit ? `<button class="edit-post-btn w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 border-none bg-transparent outline-none" data-post-id="${post.id}" data-text="${encodeURIComponent(post.metin)}">Düzenle</button>` : ''}
                    <button class="delete-post-btn w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50 border-none bg-transparent outline-none" data-post-id="${post.id}">Sil</button>
                </div>
            </div>
        `;
    }

    let commentsHTML = '';
    const allComments = post.gonderi_yorumlari || [];
    allComments.filter(c => !c.ust_yorum_id).forEach(comment => {
        const cAuthor = comment.yazar || {};
        const cAvatar = cAuthor.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(cAuthor.ad_soyad || 'U')}`;
        let cOptions = (currentUserSession && currentUserSession.user.id === comment.user_id) ? `<button class="delete-comment-btn hover:text-red-500 ml-2 border-none bg-transparent outline-none" data-comment-id="${comment.id}">Sil</button>` : '';

        commentsHTML += `
            <div class="flex gap-2 items-start mt-4">
                <img src="${cAvatar}" class="w-8 h-8 rounded-full object-cover border border-slate-200 cursor-pointer user-profile-trigger" data-user-id="${comment.user_id}">
                <div class="flex-1">
                    <div class="bg-slate-100 px-3 py-1.5 rounded-xl inline-block">
                        <span class="font-bold text-[13px] text-slate-800 mr-2 cursor-pointer hover:underline user-profile-trigger" data-user-id="${comment.user_id}">${cAuthor.ad_soyad}</span>
                        <span class="text-sm text-slate-700">${comment.metin}</span>
                    </div>
                    <div class="flex gap-2 mt-0.5 ml-2 text-[11px] text-slate-400 font-semibold">
                        <button class="reply-to-comment-btn hover:text-slate-800 border-none bg-transparent outline-none" data-post-id="${post.id}" data-comment-id="${comment.id}" data-author-name="${cAuthor.ad_soyad}">Yanıtla</button>${cOptions}
                    </div>
        `;

        allComments.filter(r => r.ust_yorum_id === comment.id).forEach(reply => {
            const rAuthor = reply.yazar || {};
            const rAvatar = rAuthor.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(rAuthor.ad_soyad || 'U')}`;
            let rOptions = (currentUserSession && currentUserSession.user.id === reply.user_id) ? `<button class="delete-comment-btn hover:text-red-500 ml-2 border-none bg-transparent outline-none" data-comment-id="${reply.id}">Sil</button>` : '';

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
                <button class="action-btn like-btn flex items-center gap-2 text-sm font-semibold transition-colors border-none bg-transparent outline-none ${isLikedByMe ? 'text-red-500' : 'text-slate-500 hover:text-red-500'}" data-post-id="${post.id}" data-author-id="${post.user_id}">
                    <i class="${isLikedByMe ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}" id="like-icon-${post.id}" style="pointer-events:none;"></i> <span style="pointer-events:none;" id="like-count-${post.id}">${likesCount > 0 ? likesCount : 'Beğen'}</span>
                </button>
                <button class="action-btn comment-toggle-btn flex items-center gap-2 text-slate-500 hover:text-blue-500 transition-colors text-sm font-semibold border-none bg-transparent outline-none" data-post-id="${post.id}">
                    <i class="fa-regular fa-comment pointer-events-none"></i> <span class="pointer-events-none">${allComments.length > 0 ? allComments.length : 'Yorum Yap'}</span>
                </button>
            </div>
            <div class="comment-section ${isSingleView ? '' : 'hidden'} mt-4 pt-4 border-t border-slate-100 pointer-events-auto" id="comment-section-${post.id}">
                <div class="mb-4 space-y-1">${commentsHTML}</div>
                <div id="reply-indicator-${post.id}" class="hidden items-center justify-between bg-blue-50 text-blue-700 px-3 py-1.5 rounded-t-lg text-xs font-bold border border-blue-100 border-b-0">
                    <span><i class="fa-solid fa-reply mr-1"></i> <span id="reply-name-${post.id}"></span> kullanıcısına yanıt veriliyor</span>
                    <button class="cancel-reply-btn hover:text-red-500 border-none bg-transparent outline-none" data-post-id="${post.id}"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="flex gap-2">
                    <input type="text" id="comment-input-${post.id}" class="flex-1 px-4 py-2 bg-slate-100 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-colors" placeholder="Yorum ekle..." style="outline: none;">
                    <button class="submit-comment-btn w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-sm transition-colors border-none outline-none" data-post-id="${post.id}" data-author-id="${post.user_id}">
                        <i class="fa-solid fa-paper-plane pointer-events-none text-sm"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function loadFeed(filterType) {
    if (!currentUserSession || !feedList) return;
    feedList.innerHTML = '<div class="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200"><i class="fa-solid fa-spinner fa-spin text-2xl mb-2"></i><p>Yükleniyor...</p></div>';
    try {
        let query = supabase.from('gonderiler').select(`*, yazar:uyeler(ad_soyad, avatar_url, rol), etkilesimler(id, user_id), gonderi_yorumlari(id, metin, created_at, user_id, ust_yorum_id, yazar:uyeler(ad_soyad, avatar_url, rol))`).order('created_at', { ascending: false });
        if (filterType !== 'all') query = query.eq('gonderi_tipi', filterType);
        const { data: posts } = await query;
        if (!posts || posts.length === 0) { feedList.innerHTML = '<div class="bg-white p-8 border border-slate-200 rounded-xl text-center text-slate-500"><i class="fa-regular fa-folder-open text-3xl mb-2"></i><p>Henüz paylaşım yok.</p></div>'; return; }
        feedList.innerHTML = '';
        posts.forEach(p => feedList.insertAdjacentHTML('beforeend', generatePostHTML(p, false)));
    } catch (e) {}
}

document.addEventListener('click', async (e) => {
    if (!currentUserSession) return;
    const target = e.target;

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

    if (target.classList.contains('delete-post-btn')) {
        const postId = target.getAttribute('data-post-id');
        Swal.fire({
            title: 'Emin misin?', text: "Bu gönderiyi kalıcı olarak sileceksin!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Evet, Sil!', cancelButtonText: 'İptal'
        }).then(async (result) => {
            if (result.isConfirmed) { await supabase.from('gonderiler').delete().eq('id', postId); loadFeed(currentFeedFilter); if(closeSinglePostBtn) closeSinglePostBtn.click(); }
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
        if (newText && newText !== oldText) { await supabase.from('gonderiler').update({ metin: newText }).eq('id', postId); loadFeed(currentFeedFilter); if(closeSinglePostBtn) closeSinglePostBtn.click(); }
    }

    if (target.classList.contains('edit-comment-btn')) {
        const commentId = target.getAttribute('data-comment-id');
        const oldText = decodeURIComponent(target.getAttribute('data-text'));
        const { value: newText } = await Swal.fire({ input: 'text', inputValue: oldText, showCancelButton: true, confirmButtonText: 'Kaydet', cancelButtonText: 'İptal' });
        if (newText && newText !== oldText) { await supabase.from('gonderi_yorumlari').update({ metin: newText }).eq('id', commentId); loadFeed(currentFeedFilter); }
    }
});

document.addEventListener('dblclick', async (e) => {
    if (!currentUserSession) return;
    const target = e.target;
    if (target.classList.contains('post-media-item')) {
        if (window.getSelection) window.getSelection().removeAllRanges();
        const postId = target.getAttribute('data-post-id');
        const authorId = target.getAttribute('data-author-id');
        const bigHeart = document.getElementById(`big-heart-${postId}`);
        if (bigHeart) { bigHeart.classList.remove('heart-pop'); void bigHeart.offsetWidth; bigHeart.classList.add('heart-pop'); }

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
                if (authorId !== currentUserSession.user.id) await supabase.from('bildirimler').insert([{ alici_id: authorId, gonderen_id: currentUserSession.user.id, mesaj: 'Gönderini beğendi.', gonderi_id: postId }]);
            } catch (err) {}
        }
    }
});

window.openUserProfile = async (uId) => {
    currentlyViewingProfileId = uId;
    if(userProfileModal) { userProfileModal.classList.remove('hidden'); setTimeout(() => userProfileModal.classList.remove('translate-x-full'), 10); }
    const tabGridBtn = document.getElementById('tab-grid');
    if(tabGridBtn) tabGridBtn.click();

    if(upGrid) upGrid.innerHTML = '<div class="col-span-3 text-center p-10"><i class="fa-solid fa-spinner fa-spin text-2xl text-slate-400"></i></div>';
    const upQuestionsList = document.getElementById('up-questions-list');
    if(upQuestionsList) upQuestionsList.innerHTML = '<div class="text-center p-10"><i class="fa-solid fa-spinner fa-spin text-2xl text-slate-400"></i></div>';

    try {
        const { data: user } = await supabase.from('uyeler').select('*').eq('id', uId).single();
        if(upHeaderName) upHeaderName.innerText = user.ad_soyad; 
        if(upName) upName.innerText = user.ad_soyad; 
        if(upRole) upRole.innerText = user.rol; 
        if(upBio) upBio.innerText = user.biyografi || '';
        const userAvatar = user.avatar_url || 'https://via.placeholder.com/150';
        if(upAvatar) upAvatar.src = userAvatar;

        if (uId === currentUserSession.user.id) { 
            if(followBtn) followBtn.classList.add('hidden'); if(unfollowBtn) unfollowBtn.classList.add('hidden'); if(messageUserBtn) messageUserBtn.classList.add('hidden');
        } else {
            if(messageUserBtn) {
                messageUserBtn.classList.remove('hidden');
                messageUserBtn.onclick = () => {
                    userProfileModal.classList.add('translate-x-full'); setTimeout(() => userProfileModal.classList.add('hidden'), 300);
                    openChat(uId, user.ad_soyad, userAvatar);
                };
            }
            const { data: follow } = await supabase.from('takipler').select('id').eq('takip_eden_id', currentUserSession.user.id).eq('takip_edilen_id', uId).single();
            if (follow) { if(followBtn) followBtn.classList.add('hidden'); if(unfollowBtn) unfollowBtn.classList.remove('hidden'); } 
            else { if(unfollowBtn) unfollowBtn.classList.add('hidden'); if(followBtn) followBtn.classList.remove('hidden'); }
        }

        const { count: fer } = await supabase.from('takipler').select('*', { count: 'exact', head: true }).eq('takip_edilen_id', uId);
        const { count: fing } = await supabase.from('takipler').select('*', { count: 'exact', head: true }).eq('takip_eden_id', uId);
        if(upFollowerCount) upFollowerCount.innerText = fer || 0; if(upFollowingCount) upFollowingCount.innerText = fing || 0;

        const { data: posts } = await supabase.from('gonderiler').select(`*, yazar:uyeler(ad_soyad, avatar_url, rol), etkilesimler(id, user_id), gonderi_yorumlari(id, metin, created_at, user_id, ust_yorum_id, yazar:uyeler(ad_soyad, avatar_url, rol))`).eq('user_id', uId).order('created_at', { ascending: false });
        if(upPostCount) upPostCount.innerText = posts ? posts.length : 0;
        if(upGrid) upGrid.innerHTML = ''; if(upQuestionsList) upQuestionsList.innerHTML = '';

        if(posts) {
            posts.forEach(p => {
                if (p.gonderi_tipi === 'medya') {
                    let content = p.medya_url.endsWith('.mp4') ? '<div class="absolute inset-0 bg-black flex items-center justify-center text-white"><i class="fa-solid fa-play"></i></div>' : `<img src="${p.medya_url}" class="w-full h-full object-cover">`;
                    if(upGrid) upGrid.insertAdjacentHTML('beforeend', `<div class="aspect-square relative cursor-pointer border border-white" onclick="openSinglePost(${p.id})">${content}</div>`);
                } else { 
                    if(upQuestionsList) upQuestionsList.insertAdjacentHTML('beforeend', generatePostHTML(p, false)); 
                }
            });
            if(upGrid && upGrid.innerHTML === '') upGrid.innerHTML = '<div class="col-span-3 text-center p-10 text-sm text-slate-400">Medya gönderisi yok.</div>';
            if(upQuestionsList && upQuestionsList.innerHTML === '') upQuestionsList.innerHTML = '<p class="text-center text-sm text-slate-400 p-10">Soru gönderisi yok.</p>';
        }
    } catch(e) {}
};

document.addEventListener('click', async (e) => {
    const trig = e.target.closest('.user-profile-trigger');
    if (!trig) return;
    const uId = trig.getAttribute('data-user-id');
    if (uId) openUserProfile(uId);
});

if(closeUserProfileBtn) closeUserProfileBtn.addEventListener('click', () => { userProfileModal.classList.add('translate-x-full'); setTimeout(() => userProfileModal.classList.add('hidden'), 300); });

if(followBtn) {
    followBtn.addEventListener('click', async () => {
        await supabase.from('takipler').insert([{ takip_eden_id: currentUserSession.user.id, takip_edilen_id: currentlyViewingProfileId }]);
        await supabase.from('bildirimler').insert([{ alici_id: currentlyViewingProfileId, gonderen_id: currentUserSession.user.id, mesaj: 'Seni takip etmeye başladı.' }]);
        followBtn.classList.add('hidden'); unfollowBtn.classList.remove('hidden'); upFollowerCount.innerText = parseInt(upFollowerCount.innerText)+1;
    });
}
if(unfollowBtn) {
    unfollowBtn.addEventListener('click', async () => {
        await supabase.from('takipler').delete().eq('takip_eden_id', currentUserSession.user.id).eq('takip_edilen_id', currentlyViewingProfileId);
        unfollowBtn.classList.add('hidden'); followBtn.classList.remove('hidden'); upFollowerCount.innerText = parseInt(upFollowerCount.innerText)-1;
    });
}

window.openSinglePost = async (postId) => {
    if(singlePostModal) { singlePostModal.classList.remove('hidden'); setTimeout(() => singlePostModal.classList.remove('translate-x-full'), 10); }
    if(singlePostContainer) singlePostContainer.innerHTML = '<p class="text-center mt-20 text-slate-400"><i class="fa-solid fa-spinner fa-spin text-3xl mb-2"></i><br>Yükleniyor...</p>';
    try {
        const { data: post } = await supabase.from('gonderiler').select(`*, yazar:uyeler(ad_soyad, avatar_url, rol), etkilesimler(id, user_id), gonderi_yorumlari(id, metin, created_at, user_id, ust_yorum_id, yazar:uyeler(ad_soyad, avatar_url, rol))`).eq('id', postId).single();
        if(singlePostContainer) singlePostContainer.innerHTML = generatePostHTML(post, true);
    } catch (e) {}
};
if(closeSinglePostBtn) closeSinglePostBtn.addEventListener('click', () => { singlePostModal.classList.add('translate-x-full'); setTimeout(() => singlePostModal.classList.add('hidden'), 300); });
https://www.instagram.com/reel/DWgsq4DDHez/?igsh=MXd6bWQ4emJnbTgxdQ==

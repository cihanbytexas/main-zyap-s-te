import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = "https://ppdwtpjglkphayfxexhv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwZHd0cGpnbGtwaGF5ZnhleGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNTc5ODEsImV4cCI6MjA5NjgzMzk4MX0.fJIyyxfU15EgrNARWkISFHJvU7-o-QpZbIKbRc3q_-s";
const supabase = createClient(supabaseUrl, supabaseKey);

let currentUserSession = null;
let temporaryRegistrationData = null; 
let currentLang = 'tr';
let userDataGlobal = null;
let selectedAvatarFile = null;

// ============================================
// YARDIMCI FONKSİYONLAR VE UI MANTIĞI
// ============================================
function toggleAuthForms(activeForm) {
    const forms = [
        document.getElementById('login-form'), 
        document.getElementById('register-form'), 
        document.getElementById('forgot-password-form')
    ];
    forms.forEach(f => { if(f) f.classList.add('tw-modal-hidden'); });
    if(activeForm) activeForm.classList.remove('tw-modal-hidden');
}

function lockReviewNameIfLoggedIn() {
    const revNameInput = document.getElementById('rev-name');
    if(revNameInput) {
        if(currentUserSession && userDataGlobal) {
            revNameInput.value = userDataGlobal.ad_soyad;
            revNameInput.setAttribute('readonly', 'true');
            revNameInput.classList.add('bg-slate-200', 'cursor-not-allowed', 'opacity-70');
        } else {
            revNameInput.value = '';
            revNameInput.removeAttribute('readonly');
            revNameInput.classList.remove('bg-slate-200', 'cursor-not-allowed', 'opacity-70');
        }
    }
}

window.openGallery = function(imgUrl) {
    const imgEl = document.getElementById('gallery-image');
    const modal = document.getElementById('gallery-modal');
    if(imgEl && modal) {
        imgEl.src = imgUrl;
        document.body.style.overflow = 'hidden';
        modal.classList.remove('tw-modal-hidden');
    }
}

// ============================================
// DİL SEÇİMİ VE ÇEVİRİ MANTIĞI
// ============================================
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
            if (text.includes('<') && text.includes('>')) el.innerHTML = text;
            else el.textContent = text;
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

    if(typeof renderColors === "function") renderColors();
    if(typeof fetchApprovedReviews === "function") fetchApprovedReviews();
    document.documentElement.lang = lang === 'tr' ? 'tr' : 'en';
}

if(langTrBtn) langTrBtn.addEventListener('click', () => applyLanguage('tr'));
if(langEnBtn) langEnBtn.addEventListener('click', () => applyLanguage('en'));

// ============================================
// ASİSTAN CHATBOT
// ============================================
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
    if(chatMessages) { chatMessages.appendChild(div); chatMessages.scrollTop = chatMessages.scrollHeight; }
};

const showTypingIndicator = () => {
    const div = document.createElement('div');
    div.className = 'typing-indicator';
    div.innerHTML = `<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>`;
    if(chatMessages) { chatMessages.appendChild(div); chatMessages.scrollTop = chatMessages.scrollHeight; }
    return div;
};

if(openChatBtn) {
    openChatBtn.onclick = () => {
        if(botChatModal) {
            botChatModal.style.display = 'flex';
            document.body.classList.add('no-scroll');
        }
        if (!botChatInitialized) {
            botChatInitialized = true;
            const typingEl = showTypingIndicator();
            setTimeout(() => {
                if(typingEl) typingEl.remove();
                addMessage(currentLang === 'tr' ? 'Merhaba! Ben Öz Yapı Market asistanı. Boya, tesisat veya bataryalarımız hakkında size nasıl yardımcı olabilirim?' : 'Hello! I am the Öz Yapı Market assistant. How can I help you?', 'bot');
            }, 1500);
        }
    };
}
if(closeChatBtn) closeChatBtn.onclick = () => { 
    if(botChatModal) { botChatModal.style.display = 'none'; document.body.classList.remove('no-scroll'); }
};

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

// ============================================
// KARTELA VE PDF MODALLARI
// ============================================
const openModalBtn = document.getElementById('open-kartela-btn');
const kartelaModal = document.getElementById('kartela-modal');
const closeKartelaBtn = document.getElementById('close-modal');
const colorGrid = document.getElementById('modal-color-grid');
const colorSearch = document.getElementById('color-search');
const filterBtns = document.querySelectorAll('.filter-btn');
const openPdfBtn = document.getElementById('open-pdf-btn');
const pdfModal = document.getElementById('pdf-modal');
const closePdfModalBtn = document.getElementById('close-pdf-modal');

if(openPdfBtn) { openPdfBtn.onclick = () => { if(kartelaModal) kartelaModal.style.display = 'none'; if(pdfModal) pdfModal.style.display = 'flex'; }; }
if(closePdfModalBtn) { closePdfModalBtn.onclick = () => { if(pdfModal) pdfModal.style.display = 'none'; if(kartelaModal) kartelaModal.style.display = 'flex'; }; }

let activeFilter = 'all'; let searchTerm = '';

window.renderColors = function() {
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
        item.innerHTML = `<div class="swatch-preview" style="background-color: ${color.hex}"></div><span>${color.name}</span><div style="font-size:0.6rem; color:#9ca3af; margin-top:4px;">${typeLabel[color.type]}</div>`;
        colorGrid.appendChild(item);
    });
}

if(colorSearch) colorSearch.addEventListener('input', (e) => { searchTerm = e.target.value; if(typeof renderColors === "function") renderColors(); });

if(filterBtns.length > 0) {
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => { b.classList.remove('active'); b.style.background = 'transparent'; });
            btn.classList.add('active'); activeFilter = btn.getAttribute('data-type');
            if(typeof renderColors === "function") renderColors();
        });
    });
}

if(openModalBtn) openModalBtn.onclick = () => { if(kartelaModal) { kartelaModal.style.display = 'flex'; document.body.classList.add('no-scroll'); } if(typeof renderColors === "function") renderColors(); };
if(closeKartelaBtn) closeKartelaBtn.onclick = () => { if(kartelaModal) { kartelaModal.style.display = 'none'; document.body.classList.remove('no-scroll'); } };

// ============================================
// YORUM (REVIEW) SİSTEMİ
// ============================================
const reviewModal = document.getElementById('review-modal');
const openReviewBtn = document.getElementById('open-review-modal');
const closeReviewBtn = document.getElementById('close-review-modal');

if (openReviewBtn) openReviewBtn.onclick = () => { if(reviewModal) { reviewModal.style.display = 'flex'; document.body.classList.add('no-scroll'); lockReviewNameIfLoggedIn(); } };
if (closeReviewBtn) closeReviewBtn.onclick = () => { if(reviewModal) { reviewModal.style.display = 'none'; document.body.classList.remove('no-scroll'); } };

let selectedRating = 0;
document.querySelectorAll('#star-rating-container .review-star').forEach(star => {
    star.addEventListener('click', function() { selectedRating = parseInt(this.getAttribute('data-value')); updateStarDisplay(selectedRating); });
    star.addEventListener('mouseover', function() { const hoverValue = parseInt(this.getAttribute('data-value')); updateStarDisplay(hoverValue); });
});
document.getElementById('star-rating-container')?.addEventListener('mouseleave', () => updateStarDisplay(selectedRating));

function updateStarDisplay(value) {
    document.querySelectorAll('#star-rating-container .review-star').forEach(star => {
        const starValue = parseInt(star.getAttribute('data-value'));
        star.style.color = starValue <= value ? '#f59e0b' : '#cbd5e1';
    });
}

window.fetchApprovedReviews = async function() {
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
                    <p class="font-medium">"${r.yorum_metni}"</p>
                    <div class="client-info">
                        <div class="client-avatar bg-blue-600 text-white">${firstLetter}</div>
                        <div><h4 class="font-extrabold text-slate-900">${r.ad_soyad}</h4><span style="font-size: 0.8rem; color: var(--text-light); font-weight:bold;">${r.kategori}</span></div>
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
            ad_soyad: document.getElementById('rev-name').value, 
            kategori: document.getElementById('rev-category').value,
            puan: selectedRating, 
            yorum_metni: document.getElementById('rev-text').value
        };
        try {
            const res = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            if(data.success) {
                alert(currentLang === 'tr' ? "Teşekkürler! Yorumunuz yönetici onayından sonra yayınlanacaktır." : "Thank you! Your review will be published after admin approval.");
                reviewForm.reset(); selectedRating = 0; updateStarDisplay(0); 
                if(reviewModal) { reviewModal.style.display = 'none'; document.body.classList.remove('no-scroll'); }
            } else { alert("Hata / Error: " + data.error); }
        } catch(err) {
            alert(currentLang === 'tr' ? "Sistemde bir arıza oluştu, lütfen daha sonra tekrar deneyin." : "A system error occurred, please try again later.");
        }
    });
}

// ============================================
// DİNAMİK GALERİ YÜKLEME (YENİ - V4)
// ============================================
async function loadGallery() {
    const galleryList = document.getElementById('dynamic-gallery-list');
    if(!galleryList) return;
    
    galleryList.innerHTML = '<div class="col-span-full text-center text-slate-400 py-10"><i class="fa-solid fa-spinner fa-spin text-3xl text-blue-500"></i></div>';
    try {
        const { data: items, error } = await supabase.from('galeri').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        if (!items || items.length === 0) {
            galleryList.innerHTML = '<div class="col-span-full text-center text-slate-400 py-10 font-bold">Henüz görsel eklenmemiş.</div>';
            return;
        }
        galleryList.innerHTML = '';
        items.forEach(item => {
            const descHtml = item.aciklama ? `<div class="absolute bottom-0 left-0 w-full p-4 transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300"><p class="text-white font-extrabold text-xs drop-shadow-md leading-tight line-clamp-2">${item.aciklama}</p></div>` : '';
            const gradientHtml = item.aciklama ? `<div class="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>` : '';
            
            galleryList.insertAdjacentHTML('beforeend', `
                <div class="group relative rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer h-48 sm:h-56 md:h-64 bg-slate-100 border border-slate-200" onclick="openGallery('${item.gorsel_url}')">
                    <img src="${item.gorsel_url}" class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700">
                    ${gradientHtml}
                    ${descHtml}
                </div>
            `);
        });
    } catch(e) {
        galleryList.innerHTML = '<div class="col-span-full text-center text-red-500 py-10 font-bold">Yüklenemedi.</div>';
    }
}

// ============================================
// GENEL SİTE ETKİLEŞİMLERİ (Navigasyon vs.)
// ============================================
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const navLinks = document.getElementById('nav-links');
const navLinksItems = document.querySelectorAll('.nav-links a.nav-item');

if(mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        if(navLinks) navLinks.classList.toggle('active');
        const icon = mobileMenuBtn.querySelector('i');
        if(icon) { icon.classList.toggle('fa-bars-staggered'); icon.classList.toggle('fa-xmark'); }
    });
}

navLinksItems.forEach(item => {
    item.addEventListener('click', () => {
        if(navLinks) navLinks.classList.remove('active');
        if(mobileMenuBtn) mobileMenuBtn.querySelector('i').className = 'fa-solid fa-bars-staggered';
    });
});

const navbar = document.getElementById('navbar');
const sections = document.querySelectorAll('section');

window.addEventListener('scroll', () => {
    if(navbar) navbar.classList.toggle('scrolled', window.scrollY > 50);
    let current = '';
    sections.forEach(section => { if (pageYOffset >= (section.offsetTop - 250)) current = section.getAttribute('id'); });
    navLinksItems.forEach(a => {
        a.classList.remove('active');
        if (a.getAttribute('href')?.includes(current)) a.classList.add('active');
    });
});

const reveals = document.querySelectorAll('.reveal');
const revealOnScroll = () => { reveals.forEach(reveal => { if (reveal.getBoundingClientRect().top < window.innerHeight - 100) reveal.classList.add('active'); }); }
window.addEventListener('scroll', revealOnScroll); revealOnScroll();

// ============================================
// AUTH & GOOGLE SİSTEMİ MANTIĞI
// ============================================
const authModalWrapper = document.getElementById('auth-modal-wrapper');
const navAuthMainBtn = document.getElementById('nav-main-auth-btn');
const closeAuthModalBtn = document.getElementById('close-auth-modal');
const profileFabBtn = document.getElementById('profile-fab-btn');

function openAuthModal(formType) {
    if(authModalWrapper) {
        document.body.classList.add('no-scroll');
        authModalWrapper.classList.remove('tw-modal-hidden');
        authModalWrapper.classList.add('flex');
        toggleAuthForms(document.getElementById(`${formType}-form`));
    }
}

if(navAuthMainBtn) navAuthMainBtn.addEventListener('click', () => openAuthModal('login'));

if(closeAuthModalBtn) {
    closeAuthModalBtn.addEventListener('click', () => {
        if(authModalWrapper) {
            authModalWrapper.classList.add('tw-modal-hidden'); 
            authModalWrapper.classList.remove('flex');
            document.body.classList.remove('no-scroll');
        }
    });
}

const handleGoogleAuth = async (e) => {
    e.preventDefault();
    try {
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + window.location.pathname } });
        if (error) throw error;
    } catch (error) { Swal.fire({ icon: 'error', title: 'Hata', text: 'Google ile bağlantı kurulamadı.' }); }
};

document.getElementById('google-login-btn')?.addEventListener('click', handleGoogleAuth);
document.getElementById('google-register-btn')?.addEventListener('click', handleGoogleAuth);

if(profileFabBtn) profileFabBtn.addEventListener('click', () => { window.location.href = 'ozsocial.html'; });

const showRegisterBtn = document.getElementById('show-register');
const showLoginBtn = document.getElementById('show-login');
const showForgotPasswordBtn = document.getElementById('show-forgot-password');
const backToLoginBtn = document.getElementById('back-to-login');
const avatarInput = document.getElementById('reg-avatar');
const avatarPreview = document.getElementById('avatar-preview');

if(avatarInput) {
    avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            selectedAvatarFile = file;
            const reader = new FileReader();
            reader.onload = (ev) => { if(avatarPreview) avatarPreview.innerHTML = `<img src="${ev.target.result}" class="w-full h-full object-cover">`; };
            reader.readAsDataURL(file);
        }
    });
}

if(showRegisterBtn) showRegisterBtn.addEventListener('click', (e) => { e.preventDefault(); toggleAuthForms(document.getElementById('register-form')); });
if(showLoginBtn) showLoginBtn.addEventListener('click', (e) => { e.preventDefault(); toggleAuthForms(document.getElementById('login-form')); });
if(showForgotPasswordBtn) showForgotPasswordBtn.addEventListener('click', (e) => { e.preventDefault(); toggleAuthForms(document.getElementById('forgot-password-form')); });
if(backToLoginBtn) backToLoginBtn.addEventListener('click', (e) => { e.preventDefault(); toggleAuthForms(document.getElementById('login-form')); });

const regFormEl = document.getElementById('register-form');
if(regFormEl) {
    regFormEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const role = document.getElementById('reg-role').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const btn = document.getElementById('register-btn');
        
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kayıt Olunuyor...'; btn.disabled = true;
        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
            if (authError) throw authError;

            if (authData.user) {
                let finalAvatarUrl = null;
                if (selectedAvatarFile) {
                    const ext = selectedAvatarFile.name.split('.').pop();
                    const fileName = `${authData.user.id}-${Math.random()}.${ext}`;
                    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, selectedAvatarFile);
                    if (!uploadError) finalAvatarUrl = supabase.storage.from('avatars').getPublicUrl(fileName).data.publicUrl;
                }
                await supabase.from('uyeler').insert([{ id: authData.user.id, ad_soyad: name, rol: role, avatar_url: finalAvatarUrl, biyografi: "" }]);
                
                Swal.fire({ icon: 'success', title: 'Hesabınız Açıldı!', timer: 1500, showConfirmButton: false });
                regFormEl.reset(); selectedAvatarFile = null;
                if(avatarPreview) avatarPreview.innerHTML = '<i class="fa-solid fa-camera text-2xl text-slate-400"></i>';
                
                if(authModalWrapper) { authModalWrapper.classList.add('tw-modal-hidden'); document.body.classList.remove('no-scroll'); }
                checkSession();
            }
        } catch (error) { Swal.fire({ icon: 'error', title: 'Hata', text: error.message }); }
        finally { btn.innerHTML = 'Kayıt Ol'; btn.disabled = false; }
    });
}

const loginFormEl = document.getElementById('login-form');
if(loginFormEl) {
    loginFormEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const btn = document.getElementById('login-btn');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Bekleyin...'; btn.disabled = true;
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            loginFormEl.reset();
            
            if(authModalWrapper) { authModalWrapper.classList.add('tw-modal-hidden'); document.body.classList.remove('no-scroll'); }
            checkSession();
        } catch (error) { Swal.fire({ icon: 'error', title: 'Başarısız', text: "E-posta veya şifre hatalı!" }); }
        finally { btn.innerHTML = 'Giriş Yap'; btn.disabled = false; }
    });
}

// ============================================
// OTURUM (SESSION) KONTROLÜ
// ============================================
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        currentUserSession = session;
        const navAuthBtnsContainer = document.getElementById('nav-auth-buttons');
        const profileFabContainer = document.getElementById('profile-fab-container');
        
        if(navAuthBtnsContainer) navAuthBtnsContainer.classList.add('tw-modal-hidden');
        if(profileFabContainer) { profileFabContainer.classList.remove('tw-modal-hidden'); profileFabContainer.classList.add('flex'); }

        try {
            const { data: userData } = await supabase.from('uyeler').select('*').eq('id', session.user.id).single();
            if (userData) {
                userDataGlobal = userData; 
                const avatarUrl = userData.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.ad_soyad || 'U')}&background=1e3a8a&color=fff`;
                const fabAvatar = document.getElementById('fab-avatar');
                if(fabAvatar) fabAvatar.src = avatarUrl;
            } else {
                const fullName = session.user.user_metadata?.full_name || session.user.email.split('@')[0];
                const gAvatarUrl = session.user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=1e3a8a&color=fff`;
                
                await supabase.from('uyeler').insert([{ id: session.user.id, ad_soyad: fullName, rol: 'Müşteri', avatar_url: session.user.user_metadata?.avatar_url || null, biyografi: "" }]);
                
                userDataGlobal = { ad_soyad: fullName, avatar_url: session.user.user_metadata?.avatar_url || null };
                const fabAvatar = document.getElementById('fab-avatar');
                if(fabAvatar) fabAvatar.src = gAvatarUrl;
            }
        } catch (e) {}
        lockReviewNameIfLoggedIn(); 
    } else {
        currentUserSession = null; userDataGlobal = null; lockReviewNameIfLoggedIn(); 
        
        const navAuthBtnsContainer = document.getElementById('nav-auth-buttons');
        const profileFabContainer = document.getElementById('profile-fab-container');
        if(navAuthBtnsContainer) navAuthBtnsContainer.classList.remove('tw-modal-hidden');
        if(profileFabContainer) { profileFabContainer.classList.add('tw-modal-hidden'); profileFabContainer.classList.remove('flex'); }
    }
}

// Başlangıç Yüklemeleri
if(typeof fetchApprovedReviews === "function") fetchApprovedReviews();
loadGallery(); // Galeri Fotoğraflarını Çek
checkSession();

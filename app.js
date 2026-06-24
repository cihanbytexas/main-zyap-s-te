import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// ============================================
// SUPABASE BAĞLANTISI
// ============================================
const supabaseUrl = "https://ppdwtpjglkphayfxexhv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwZHd0cGpnbGtwaGF5ZnhleGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNTc5ODEsImV4cCI6MjA5NjgzMzk4MX0.fJIyyxfU15EgrNARWkISFHJvU7-o-QpZbIKbRc3q_-s";
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// GLOBAL STATE (DURUM) DEĞİŞKENLERİ
// ============================================
let currentUserSession = null;
let temporaryRegistrationData = null; 
let currentLang = 'tr';
let userDataGlobal = null;
let selectedAvatarFile = null;

// ============================================
// YARDIMCI FONKSİYONLAR (UI & AUTH)
// ============================================
function toggleAuthForms(activeForm) {
    const forms = [
        document.getElementById('login-form'), 
        document.getElementById('register-form'), 
        document.getElementById('forgot-password-form'), 
        document.getElementById('reset-password-form'), 
        document.getElementById('otp-verify-form'), 
        document.getElementById('reset-otp-form')
    ];
    forms.forEach(f => { if(f) f.classList.add('tw-modal-hidden'); });
    if(activeForm) activeForm.classList.remove('tw-modal-hidden');
}

// 2. Kural İsteği: Yorum kısmında giriş yapan kişinin ismi kilitlensin ve sönük olsun
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
            document.body.classList.add('no-scroll'); // Arka sayfa kayması (bleed) engellendi
        }
        if (!botChatInitialized) {
            botChatInitialized = true;
            const typingEl = showTypingIndicator();
            setTimeout(() => {
                if(typingEl) typingEl.remove();
                addMessage(currentLang === 'tr' ? 'Merhaba! Ben Öz Yapı Market asistanı. Boya, tesisat veya bataryalarımız hakkında size nasıl yardımcı olabilirim?' : 'Hello! I am the Öz Yapı Market assistant. How can I help you about our paints, plumbing or batteries?', 'bot');
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
            filterBtns.forEach(b => { b.classList.remove('active'); b.style.background = 'rgba(255,255,255,0.05)'; });
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
// GENEL SİTE ETKİLEŞİMLERİ (Navigasyon vs.)
// ============================================
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const navLinks = document.getElementById('nav-links');
const navLinksItems = document.querySelectorAll('.nav-links a');

if(mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        if(navLinks) navLinks.classList.toggle('active');
        const icon = mobileMenuBtn.querySelector('i');
        if(icon) { icon.classList.toggle('fa-bars'); icon.classList.toggle('fa-xmark'); }
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
const revealOnScroll = () => { reveals.forEach(reveal => { if (reveal.getBoundingClientRect().top < window.innerHeight - 150) reveal.classList.add('active'); }); }
window.addEventListener('scroll', revealOnScroll); revealOnScroll();

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

// ============================================
// AUTH & OTP & GOOGLE SİSTEMİ MANTIĞI
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

// GOOGLE İLE GİRİŞ / KAYIT İŞLEMLERİ
const handleGoogleAuth = async (e) => {
    e.preventDefault();
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + window.location.pathname
            }
        });
        if (error) throw error;
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Hata', text: 'Google ile bağlantı kurulamadı.' });
    }
};

const googleLoginBtn = document.getElementById('google-login-btn');
if(googleLoginBtn) googleLoginBtn.addEventListener('click', handleGoogleAuth);

const googleRegisterBtn = document.getElementById('google-register-btn');
if(googleRegisterBtn) googleRegisterBtn.addEventListener('click', handleGoogleAuth);


// Girişli kullanıcı doğrudan Öz Social'a fırlatılır
if(profileFabBtn) profileFabBtn.addEventListener('click', () => { window.location.href = 'ozsocial.html'; });

const showRegisterBtn = document.getElementById('show-register');
const showLoginBtn = document.getElementById('show-login');
const showForgotPasswordBtn = document.getElementById('show-forgot-password');
const backToLoginBtn = document.getElementById('back-to-login');
const backToRegFromOtpBtn = document.getElementById('back-to-reg-from-otp');
const backToForgotFromResetBtn = document.getElementById('back-to-forgot-from-reset');
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
if(backToRegFromOtpBtn) backToRegFromOtpBtn.addEventListener('click', (e) => { e.preventDefault(); toggleAuthForms(document.getElementById('register-form')); });
if(backToForgotFromResetBtn) backToForgotFromResetBtn.addEventListener('click', (e) => { e.preventDefault(); toggleAuthForms(document.getElementById('forgot-password-form')); });

const regFormEl = document.getElementById('register-form');
if(regFormEl) {
    regFormEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const role = document.getElementById('reg-role').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const btn = document.getElementById('register-btn');
        
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kod Gönderiliyor...'; btn.disabled = true;
        try {
            const { error: authError } = await supabase.auth.signUp({ email, password });
            if (authError) throw authError;

            temporaryRegistrationData = { name, role, email, password, file: selectedAvatarFile };
            Swal.fire({ icon: 'success', title: 'Kod Gönderildi', text: 'E-postanıza gelen 6 haneli doğrulama kodunu giriniz.' });
            toggleAuthForms(document.getElementById('otp-verify-form'));
        } catch (error) { Swal.fire({ icon: 'error', title: 'Hata', text: error.message }); }
        finally { btn.innerHTML = 'Kayıt Ol'; btn.disabled = false; }
    });
}

const otpVerifyForm = document.getElementById('otp-verify-form');
if(otpVerifyForm) {
    otpVerifyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const otpCode = document.getElementById('reg-otp').value.trim();
        const btn = document.getElementById('verify-otp-btn');
        if(!temporaryRegistrationData) return;

        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Doğrulanıyor...'; btn.disabled = true;
        try {
            const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({ email: temporaryRegistrationData.email, token: otpCode, type: 'signup' });
            if (verifyError) throw verifyError;

            if (verifyData.user) {
                let finalAvatarUrl = null;
                if (temporaryRegistrationData.file) {
                    const ext = temporaryRegistrationData.file.name.split('.').pop();
                    const fileName = `${verifyData.user.id}-${Math.random()}.${ext}`;
                    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, temporaryRegistrationData.file);
                    if (!uploadError) finalAvatarUrl = supabase.storage.from('avatars').getPublicUrl(fileName).data.publicUrl;
                }
                await supabase.from('uyeler').insert([{ id: verifyData.user.id, ad_soyad: temporaryRegistrationData.name, rol: temporaryRegistrationData.role, avatar_url: finalAvatarUrl, biyografi: "" }]);
                
                Swal.fire({ icon: 'success', title: 'Hesabınız Açıldı!', timer: 1500, showConfirmButton: false });
                regFormEl.reset(); otpVerifyForm.reset(); temporaryRegistrationData = null; selectedAvatarFile = null;
                if(avatarPreview) avatarPreview.innerHTML = '<i class="fa-solid fa-camera text-2xl text-slate-400 group-hover:text-blue-500 transition-colors"></i>';
                
                if(authModalWrapper) {
                    authModalWrapper.classList.add('tw-modal-hidden');
                    document.body.classList.remove('no-scroll');
                }
                checkSession();
            }
        } catch (error) { Swal.fire({ icon: 'error', title: 'Geçersiz Kod', text: 'Girdiğiniz kod hatalı veya süresi dolmuş.' }); }
        finally { btn.innerHTML = 'Doğrula & Hesabı Aç'; btn.disabled = false; }
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
            
            if(authModalWrapper) {
                authModalWrapper.classList.add('tw-modal-hidden');
                document.body.classList.remove('no-scroll');
            }
            checkSession();
        } catch (error) { Swal.fire({ icon: 'error', title: 'Başarısız', text: "E-posta veya şifre hatalı!" }); }
        finally { btn.innerHTML = 'Giriş Yap'; btn.disabled = false; }
    });
}

const forgotPasswordForm = document.getElementById('forgot-password-form');
if(forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgot-email').value;
        const btn = document.getElementById('forgot-btn');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Gönderiliyor...'; btn.disabled = true;
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) throw error;
            Swal.fire({ icon: 'success', title: 'Kod Gönderildi', text: 'Lütfen mailinize gelen 6 haneli kodu kontrol edin.' });
            toggleAuthForms(document.getElementById('reset-otp-form'));
        } catch (error) { Swal.fire({ icon: 'error', title: 'Hata', text: error.message }); }
        finally { btn.innerHTML = 'Kod Gönder'; btn.disabled = false; }
    });
}

const resetOtpForm = document.getElementById('reset-otp-form');
if(resetOtpForm) {
    resetOtpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgot-email').value;
        const token = document.getElementById('reset-otp-code').value.trim();
        const newPassword = document.getElementById('reset-new-password').value;
        const btn = document.getElementById('reset-otp-btn');
        
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Güncelleniyor...'; btn.disabled = true;
        try {
            const { error: verifyError } = await supabase.auth.verifyOtp({ email, token, type: 'recovery' });
            if (verifyError) throw verifyError;
            
            const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
            if (updateError) throw updateError;

            Swal.fire({ icon: 'success', title: 'Başarılı', text: 'Şifreniz başarıyla güncellendi.', timer: 1500, showConfirmButton: false });
            resetOtpForm.reset(); if(forgotPasswordForm) forgotPasswordForm.reset();
            toggleAuthForms(loginFormEl);
        } catch (error) { Swal.fire({ icon: 'error', title: 'Hata', text: 'Geçersiz kod veya güncelleme hatası.' }); }
        finally { btn.innerHTML = 'Şifremi Güncelle'; btn.disabled = false; }
    });
}

// ============================================
// OTURUM (SESSION) KONTROLÜ (Giriş yapan direk atılmaz, sadece FAB butonu çıkar)
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
                // Google vb. ile ilk giriş yapanlar için tabloyu otomatik doldur
                const fullName = session.user.user_metadata?.full_name || session.user.email.split('@')[0];
                const gAvatarUrl = session.user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=1e3a8a&color=fff`;
                
                await supabase.from('uyeler').insert([{ 
                    id: session.user.id, 
                    ad_soyad: fullName, 
                    rol: 'Müşteri', 
                    avatar_url: session.user.user_metadata?.avatar_url || null, 
                    biyografi: "" 
                }]);
                
                userDataGlobal = { ad_soyad: fullName, avatar_url: session.user.user_metadata?.avatar_url || null };
                const fabAvatar = document.getElementById('fab-avatar');
                if(fabAvatar) fabAvatar.src = gAvatarUrl;
            }
        } catch (e) {}
        
        lockReviewNameIfLoggedIn(); 
    } else {
        currentUserSession = null;
        userDataGlobal = null;
        lockReviewNameIfLoggedIn(); 
        
        const navAuthBtnsContainer = document.getElementById('nav-auth-buttons');
        const profileFabContainer = document.getElementById('profile-fab-container');
        if(navAuthBtnsContainer) navAuthBtnsContainer.classList.remove('tw-modal-hidden');
        if(profileFabContainer) { profileFabContainer.classList.add('tw-modal-hidden'); profileFabContainer.classList.remove('flex'); }
    }
}

// Başlangıç Yüklemeleri
if(typeof fetchApprovedReviews === "function") fetchApprovedReviews();
checkSession();


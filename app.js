// ============================================
// SUPABASE İNİTİALİZATİON & AUTHENTİCATİON
// ============================================
const supabaseUrl = "https://ppdwtpjglkphayfxexhv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwZHd0cGpnbGtwaGF5ZnhleGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNTc5ODEsImV4cCI6MjA5NjgzMzk4MX0.fJIyyxfU15EgrNARWkISFHJvU7-o-QpZbIKbRc3q_-s";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let currentUser = null;

// Auth UI Elementleri
const authModal = document.getElementById('auth-modal');
const closeAuthBtn = document.getElementById('close-auth-btn');
const navAuthBtn = document.getElementById('nav-auth-btn');
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const authForm = document.getElementById('auth-form');
const nameField = document.getElementById('name-field');
const authName = document.getElementById('auth-name');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authError = document.getElementById('auth-error');

let isLoginMode = true;

// Modalı Aç/Kapat
navAuthBtn.onclick = async () => {
    if (currentUser) {
        // Çıkış Yap
        await supabase.auth.signOut();
    } else {
        authModal.style.display = 'flex';
        authError.innerText = '';
        authForm.reset();
    }
};

closeAuthBtn.onclick = () => authModal.style.display = 'none';

// Sekme Geçişleri (Giriş / Kayıt)
tabLogin.onclick = () => {
    isLoginMode = true;
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    nameField.style.display = 'none';
    authName.removeAttribute('required');
    authSubmitBtn.innerText = currentLang === 'tr' ? 'Giriş Yap' : 'Log In';
    authError.innerText = '';
};

tabRegister.onclick = () => {
    isLoginMode = false;
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    nameField.style.display = 'block';
    authName.setAttribute('required', 'true');
    authSubmitBtn.innerText = currentLang === 'tr' ? 'Kayıt Ol' : 'Register';
    authError.innerText = '';
};

// Form Gönderimi (Giriş / Kayıt İşlemleri)
authForm.onsubmit = async (e) => {
    e.preventDefault();
    authError.innerText = '';
    authSubmitBtn.disabled = true;
    authSubmitBtn.innerText = currentLang === 'tr' ? 'Bekleyin...' : 'Please wait...';

    const email = authEmail.value;
    const password = authPassword.value;
    const fullName = authName.value;

    try {
        if (isLoginMode) {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
        } else {
            const { error } = await supabase.auth.signUp({
                email, password, options: { data: { full_name: fullName } }
            });
            if (error) throw error;
            alert(currentLang === 'tr' ? "Kayıt başarılı! Giriş yapabilirsiniz." : "Registration successful! You can log in.");
            tabLogin.click(); // Başarılı kayıttan sonra giriş sekmesine at
        }
        
        if (isLoginMode) authModal.style.display = 'none'; // Sadece giriş başarılıysa kapat
    } catch (err) {
        authError.innerText = currentLang === 'tr' ? 'Hata: Bilgileri kontrol edin.' : 'Error: Please check your details.';
    } finally {
        authSubmitBtn.disabled = false;
        authSubmitBtn.innerText = isLoginMode 
            ? (currentLang === 'tr' ? 'Giriş Yap' : 'Log In') 
            : (currentLang === 'tr' ? 'Kayıt Ol' : 'Register');
    }
};

// Auth Durumunu Dinle (Hibrit Yorum Mantığı)
supabase.auth.onAuthStateChange((event, session) => {
    currentUser = session?.user || null;
    const revNameInput = document.getElementById('rev-name');
    
    if (currentUser) {
        // Oturum açtıysa
        navAuthBtn.innerText = currentLang === 'tr' ? 'Çıkış Yap' : 'Log Out';
        navAuthBtn.style.background = '#ef4444'; // Kırmızı renk çıkış hissi için
        
        // İsmi otomatik doldur ve kitle (sönük yap)
        const fullName = currentUser.user_metadata?.full_name || currentUser.email.split('@')[0];
        revNameInput.value = fullName;
        revNameInput.disabled = true;
    } else {
        // Oturum kapalıysa
        navAuthBtn.innerText = currentLang === 'tr' ? 'Giriş Yap' : 'Login';
        navAuthBtn.style.background = 'var(--text-dark)';
        
        // İsmi serbest bırak ve boşalt
        revNameInput.value = '';
        revNameInput.disabled = false;
    }
});


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
    if (chatInput) chatInput.placeholder = lang === 'tr' ? 'Mesajınızı yazın...' : 'Type your message...';

    // Üst menü buton metni güncelleme (Auth statüsüne göre)
    if(currentUser) {
        navAuthBtn.innerText = lang === 'tr' ? 'Çıkış Yap' : 'Log Out';
    } else {
        navAuthBtn.innerText = lang === 'tr' ? 'Giriş Yap' : 'Login';
    }

    renderColors();
    fetchApprovedReviews();
    document.documentElement.lang = lang === 'tr' ? 'tr' : 'en';
}

langTrBtn.addEventListener('click', () => applyLanguage('tr'));
langEnBtn.addEventListener('click', () => applyLanguage('en'));

// ============================================
// CHATBOT MANTIĞI & YAZIYOR ANİMASYONU
// ============================================
const openChatBtn = document.getElementById('open-chatbot');
const chatModal = document.getElementById('chat-modal');
const closeChatBtn = document.getElementById('close-chat');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');
const chatMessages = document.getElementById('chat-messages');

let chatInitialized = false;

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
    div.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
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
            addMessage(
                currentLang === 'tr' 
                    ? 'Merhaba! Ben Öz Yapı Market asistanı. Boya, tesisat veya bataryalarımız hakkında size nasıl yardımcı olabilirim?'
                    : 'Hello! I am the Öz Yapı Market assistant. How can I help you about our paints, plumbing or batteries?', 
                'bot'
            );
        }, 1500);
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
        const userName = currentUser ? (currentUser.user_metadata?.full_name || currentUser.email) : "Ziyaretçi Müşteri";
        const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: userName, message: val })
        });
        if (!res.ok) throw new Error('API Hatası');
        const data = await res.json();
        
        typingEl.remove();
        addMessage(data.reply || (currentLang === 'tr' ? "Cevap alınamadı" : "No response received"), 'bot');
    } catch (e) {
        typingEl.remove();
        addMessage(currentLang === 'tr' ? "Bağlantı hatası oluştu, lütfen tekrar deneyin." : "Connection error, please try again.", 'bot');
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

colorSearch.addEventListener('input', (e) => { searchTerm = e.target.value; renderColors(); });

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => { b.classList.remove('active'); });
        btn.classList.add('active');
        activeFilter = btn.getAttribute('data-type');
        renderColors();
    });
});

openModalBtn.onclick = () => { modal.style.display = 'flex'; renderColors(); };
closeModalBtn.onclick = () => modal.style.display = 'none';

// ============================================
// DİNAMİK YORUM YAPMA VE LİSTELEME SİTEMİ
// ============================================
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

document.getElementById('star-rating-container')?.addEventListener('mouseleave', () => {
    updateStarDisplay(selectedRating);
});

function updateStarDisplay(value) {
    document.querySelectorAll('#star-rating-container .review-star').forEach(star => {
        const starValue = parseInt(star.getAttribute('data-value'));
        if(starValue <= value) star.style.color = '#f59e0b';
        else star.style.color = '#cbd5e1';
    });
}

async function fetchApprovedReviews() {
    const grid = document.getElementById('dynamic-testimonials-list');
    if (!grid) return;

    try {
        const res = await fetch('/api/reviews');
        const reviews = await res.json();

        if(!reviews || reviews.length === 0) {
            grid.innerHTML = currentLang === 'tr' 
                ? `<p style="text-align:center; grid-column: 1/-1; color: var(--text-light);">Henüz yorum yapılmamış. İlk yorumu siz yapın!</p>`
                : `<p style="text-align:center; grid-column: 1/-1; color: var(--text-light);">No reviews yet. Be the first to write a review!</p>`;
            return;
        }

        grid.innerHTML = '';
        reviews.forEach(r => {
            const firstLetter = r.ad_soyad ? r.ad_soyad.charAt(0).toUpperCase() : 'M';
            grid.innerHTML += `
                <div class="testimonial-card">
                    <i class="fa-solid fa-quote-right quote-icon"></i>
                    <div class="stars">
                        ${'<i class="fa-solid fa-star"></i>'.repeat(r.puan)}${`<i class="fa-regular fa-star" style="color:#cbd5e1"></i>`.repeat(5 - r.puan)}
                    </div>
                    <p>"${r.yorum_metni}"</p>
                    <div class="client-info">
                        <div class="client-avatar" style="background: var(--primary-color); color:white; display:flex; align-items:center; justify-content:center; font-weight:bold;">${firstLetter}</div>
                        <div>
                            <h4>${r.ad_soyad}</h4>
                            <span style="font-size: 0.8rem; color: var(--text-light);">${r.kategori}</span>
                        </div>
                    </div>
                </div>`;
        });
    } catch (e) {
        console.error("Yorum verileri çekilirken hata oluştu:", e);
    }
}

const reviewForm = document.getElementById('user-review-form');
if(reviewForm) {
    reviewForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        if(selectedRating === 0) {
            alert(currentLang === 'tr' ? "Lütfen bir yıldız puanı seçiniz." : "Please select a star rating.");
            return;
        }

        const payload = {
            ad_soyad: document.getElementById('rev-name').value,
            kategori: document.getElementById('rev-category').value,
            puan: selectedRating,
            yorum_metni: document.getElementById('rev-text').value
        };

        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if(data.success) {
                alert(currentLang === 'tr' 
                    ? "Teşekkürler! Yorumunuz yönetici onayından sonra yayınlanacaktır." 
                    : "Thank you! Your review will be published after admin approval.");
                
                // Formu sıfırla, ama kullanıcı giriş yapmışsa ismini geri yazdır
                reviewForm.reset();
                selectedRating = 0;
                updateStarDisplay(0);
                if(currentUser) {
                    document.getElementById('rev-name').value = currentUser.user_metadata?.full_name || currentUser.email.split('@')[0];
                }
            } else {
                alert("Hata / Error: " + data.error);
            }
        } catch(err) {
            alert(currentLang === 'tr'
                ? "Sistemde bir arıza oluştu, lütfen daha sonra tekrar deneyin."
                : "A system error occurred, please try again later.");
        }
    });
}

// --- UI GENEL MANTIĞI ---
window.onclick = (e) => { 
    if(e.target == modal) modal.style.display = 'none'; 
    if(e.target == chatModal) chatModal.style.display = 'none';
    if(e.target == pdfModal) pdfModal.style.display = 'none';
    if(e.target == authModal) authModal.style.display = 'none';
}

const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const navLinks = document.getElementById('nav-links');
const navLinksItems = document.querySelectorAll('.nav-links a');

mobileMenuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    const icon = mobileMenuBtn.querySelector('i');
    icon.classList.toggle('fa-bars');
    icon.classList.toggle('fa-xmark');
});

navLinksItems.forEach(item => {
    item.addEventListener('click', () => {
        navLinks.classList.remove('active');
        mobileMenuBtn.querySelector('i').className = 'fa-solid fa-bars';
    });
});

const navbar = document.getElementById('navbar');
const sections = document.querySelectorAll('section');

window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
    let current = '';
    sections.forEach(section => {
        if (pageYOffset >= (section.offsetTop - 200)) current = section.getAttribute('id');
    });
    navLinksItems.forEach(a => {
        a.classList.remove('active');
        if (a.getAttribute('href')?.includes(current)) a.classList.add('active');
    });
});

const reveals = document.querySelectorAll('.reveal');
const revealOnScroll = () => {
    reveals.forEach(reveal => {
        if (reveal.getBoundingClientRect().top < window.innerHeight - 150) reveal.classList.add('active');
    });
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
        displayBox.style.backgroundColor = hexColor;
        displayName.textContent = swatch.getAttribute('data-name');
        displayHex.textContent = hexColor;
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // Sayfa yüklenince Supabase oturumunu kontrol et
    supabase.auth.getSession().then(({ data: { session } }) => {
        currentUser = session?.user || null;
        if(currentUser) {
            navAuthBtn.innerText = currentLang === 'tr' ? 'Çıkış Yap' : 'Log Out';
            navAuthBtn.style.background = '#ef4444';
            const revNameInput = document.getElementById('rev-name');
            revNameInput.value = currentUser.user_metadata?.full_name || currentUser.email.split('@')[0];
            revNameInput.disabled = true;
        }
    });
    fetchApprovedReviews();
});

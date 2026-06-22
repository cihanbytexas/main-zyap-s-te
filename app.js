// DİL DEĞİŞTİRME SİSTEMİ
// ============================================
let currentLang = 'tr';

const langTrBtn = document.getElementById('lang-tr');
const langEnBtn = document.getElementById('lang-en');

function applyLanguage(lang) {
    currentLang = lang;

    // Nav butonlarını güncelle
    langTrBtn.classList.toggle('active', lang === 'tr');
    langEnBtn.classList.toggle('active', lang === 'en');

    // Tüm data-tr / data-en attribute'lu elementleri güncelle
    document.querySelectorAll('[data-tr]').forEach(el => {
        const text = lang === 'tr' ? el.getAttribute('data-tr') : el.getAttribute('data-en');
        if (text) {
            // innerHTML kullanan elementler (strong tag içerenler)
            if (text.includes('<') && text.includes('>')) {
                el.innerHTML = text;
            } else {
                el.textContent = text;
            }
        }
    });

    // Placeholder'ları güncelle
    document.querySelectorAll('[data-tr-placeholder]').forEach(el => {
        const ph = lang === 'tr' ? el.getAttribute('data-tr-placeholder') : el.getAttribute('data-en-placeholder');
        if (ph) el.placeholder = ph;
    });

    // Chat input placeholder
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.placeholder = lang === 'tr' ? 'Mesajınızı yazın...' : 'Type your message...';
    }

    // Renk kartela filtreleme butonları (ic/dis etiket metni)
    renderColors();

    // Dinamik yorumları yeniden listele (Dil değiştiğinde boş mesaj uyarısı güncellensin)
    fetchApprovedReviews();

    // html lang attribute
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

// Animasyonlu mesaj ekleme
const addMessage = (text, type) => {
    const div = document.createElement('div');
    div.className = `msg msg-${type}`;
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
};

// Yazıyor... (Typing) göstergesi oluşturma
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

// Modal açılışında botun ilk mesajı animasyonlu atması
openChatBtn.onclick = () => {
    chatModal.style.display = 'flex';
    
    if (!chatInitialized) {
        chatInitialized = true;
        const typingEl = showTypingIndicator();
        
        // 1.5 saniye sonra yazıyor balonunu kaldır ve mesajı gönder
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

// Yeni mesaj gönderme işlemi
const handleSend = async () => {
    const val = chatInput.value.trim();
    if (!val) return;
    
    addMessage(val, 'user');
    chatInput.value = '';
    
    // Bot yazıyor animasyonu başlat
    const typingEl = showTypingIndicator();

    try {
        const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: "Ziyaretçi", message: val }) // İsim dinamikleştirildi
        });
        
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`HTTP ${res.status} - ${errorText}`);
        }

        const data = await res.json();
        
        typingEl.remove();
        addMessage(data.reply || (currentLang === 'tr' ? "Cevap alınamadı" : "No response received"), 'bot');
    } catch (e) {
        typingEl.remove();
        console.error("🚨 CHATBOT HATASI:", e.message);
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

// PDF Modal Tanımlamaları
const openPdfBtn = document.getElementById('open-pdf-btn');
const pdfModal = document.getElementById('pdf-modal');
const closePdfModalBtn = document.getElementById('close-pdf-modal');

if(openPdfBtn) {
    openPdfBtn.onclick = () => {
        modal.style.display = 'none';
        pdfModal.style.display = 'flex';
    };
}
if(closePdfModalBtn) {
    closePdfModalBtn.onclick = () => {
        pdfModal.style.display = 'none';
        modal.style.display = 'flex';
    };
}

let activeFilter = 'all';
let searchTerm = '';

function renderColors() {
    colorGrid.innerHTML = '';
    
    if (typeof colorList === 'undefined') {
        console.error("colorList bulunamadı! colors.js dosyasının doğru yüklendiğinden emin olun.");
        return;
    }

    const filtered = colorList.filter(color => {
        const matchesSearch = color.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = activeFilter === 'all' || color.type === activeFilter;
        return matchesSearch && matchesType;
    });

    const typeLabel = currentLang === 'tr'
        ? { ic: 'İç Cephe', dis: 'Dış Cephe' }
        : { ic: 'Interior', dis: 'Exterior' };

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

colorSearch.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    renderColors();
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => {
            b.classList.remove('active');
            b.style.background = 'rgba(255,255,255,0.05)';
        });
        btn.classList.add('active');
        activeFilter = btn.getAttribute('data-type');
        renderColors();
    });
});

openModalBtn.onclick = () => {
    modal.style.display = 'flex';
    renderColors();
};
closeModalBtn.onclick = () => modal.style.display = 'none';

// ============================================
// DİNAMİK YORUM YAPMA VE LİSTELEME SİSTEMİ
// ============================================

// YORUM MODALI MANTIĞI EKLENDİ
const reviewModal = document.getElementById('review-modal');
const openReviewBtn = document.getElementById('open-review-modal');
const closeReviewBtn = document.getElementById('close-review-modal');

if (openReviewBtn) {
    openReviewBtn.onclick = () => reviewModal.style.display = 'flex';
}
if (closeReviewBtn) {
    closeReviewBtn.onclick = () => reviewModal.style.display = 'none';
}

let selectedRating = 0;

// Yıldız Seçme ve Hover Efektleri
document.querySelectorAll('#star-rating-container .review-star').forEach(star => {
    star.addEventListener('click', function() {
        selectedRating = parseInt(this.getAttribute('data-value'));
        updateStarDisplay(selectedRating);
    });

    star.addEventListener('mouseover', function() {
        const hoverValue = parseInt(this.getAttribute('data-value'));
        updateStarDisplay(hoverValue);
    });
});

document.getElementById('star-rating-container')?.addEventListener('mouseleave', () => {
    updateStarDisplay(selectedRating);
});

function updateStarDisplay(value) {
    document.querySelectorAll('#star-rating-container .review-star').forEach(star => {
        const starValue = parseInt(star.getAttribute('data-value'));
        if(starValue <= value) {
            star.style.color = '#f59e0b'; // Altın sarısı aktif
        } else {
            star.style.color = '#cbd5e1'; // Gri inaktif
        }
    });
}

// Onaylı Yorumları Backend'den Çekip Basma
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

// Form Gönderme Tetikleyicisi
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
                reviewForm.reset();
                selectedRating = 0;
                updateStarDisplay(0);
                reviewModal.style.display = 'none'; // Gönderim başarılı olunca modalı kapat
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
    if(e.target == reviewModal) reviewModal.style.display = 'none'; // Yorum modalı boşluk tıklaması eklendi
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

// Sayfa ilk yüklendiğinde onaylı yorumları veritabanından çek
document.addEventListener('DOMContentLoaded', fetchApprovedReviews);

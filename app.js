// ============================================
// SUPABASE BAĞLANTISI (Gerçek Veritabanı)
// ============================================
const supabaseUrl = 'https://rqqajdgjqcysibcqafpl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxcWFqZGdqcWN5c2liY3FhZnBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMDkzMTgsImV4cCI6MjA5Njc4NTMxOH0.gMCwj9J-mdRkmRhETeFRwJgnevCjwLD0gjoByIPpdec';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// ============================================
// AUTH (GİRİŞ/KAYIT) ARAYÜZ MANTIĞI
// ============================================
const authModal = document.getElementById('auth-modal');
const openAuthBtn = document.getElementById('open-auth-btn');
const closeAuthBtn = document.getElementById('close-auth-modal');
const userProfileArea = document.getElementById('user-profile');
const userGreeting = document.getElementById('user-greeting');
const userAvatar = document.getElementById('user-avatar');
const logoutBtn = document.getElementById('logout-btn');

// Tab Geçişleri
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const formLogin = document.getElementById('login-form');
const formRegister = document.getElementById('register-form');

tabLogin.onclick = () => {
    tabLogin.classList.add('active'); tabRegister.classList.remove('active');
    formLogin.style.display = 'block'; formRegister.style.display = 'none';
};
tabRegister.onclick = () => {
    tabRegister.classList.add('active'); tabLogin.classList.remove('active');
    formRegister.style.display = 'block'; formLogin.style.display = 'none';
};

// Modal Aç/Kapat
if(openAuthBtn) openAuthBtn.onclick = () => authModal.style.display = 'flex';
if(closeAuthBtn) closeAuthBtn.onclick = () => authModal.style.display = 'none';

// Arayüzü Güncelleme Fonksiyonu
function updateUI(user, profileName = null) {
    if (user) {
        // Giriş Yapılmış
        openAuthBtn.style.display = 'none';
        userProfileArea.style.display = 'flex';
        const name = profileName || user.user_metadata?.full_name || "Kullanıcı";
        
        // İsme göre dinamik harf avatarı oluşturma (ui-avatars servisi ile)
        userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff&bold=true`;
        userGreeting.textContent = `Hoş geldin, ${name.split(' ')[0]}`; // Sadece ilk ismini al
    } else {
        // Çıkış Yapılmış
        openAuthBtn.style.display = 'inline-block';
        userProfileArea.style.display = 'none';
    }
}

// ============================================
// SUPABASE AUTH İŞLEMLERİ
// ============================================

// 1. Sayfa yüklendiğinde oturumu kontrol et
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        // Girişliyse profil tablosundan ismini çek
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', session.user.id).single();
        updateUI(session.user, profile?.full_name);
    } else {
        updateUI(null);
    }
}
checkSession();

// 2. Kayıt Ol (Sign Up) İşlemi
formRegister.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('reg-submit-btn');
    const msg = document.getElementById('reg-msg');
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;

    btn.textContent = "Kaydediliyor..."; msg.style.display = 'none';

    // Supabase Auth'a kayıt et (İsmi metadata olarak ekliyoruz)
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: pass,
        options: { data: { full_name: name } }
    });

    if (error) {
        msg.textContent = error.message; msg.className = "auth-msg msg-error"; msg.style.display = 'block';
    } else {
        // Başarılıysa SQL ile açtığımız profiller tablosuna yaz
        if(data.user) {
            await supabase.from('profiles').insert([
                { id: data.user.id, full_name: name }
            ]);
        }
        msg.textContent = "Kayıt başarılı! Giriş yapabilirsiniz."; msg.className = "auth-msg msg-success"; msg.style.display = 'block';
        formRegister.reset();
        setTimeout(() => tabLogin.click(), 2000); // 2 sn sonra giriş sekmesine geç
    }
    btn.textContent = "Kayıt Ol";
});

// 3. Giriş Yap (Sign In) İşlemi
formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('login-submit-btn');
    const msg = document.getElementById('login-msg');
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;

    btn.textContent = "Giriş Yapılıyor..."; msg.style.display = 'none';

    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });

    if (error) {
        msg.textContent = "E-posta veya şifre hatalı."; msg.className = "auth-msg msg-error"; msg.style.display = 'block';
    } else {
        authModal.style.display = 'none';
        formLogin.reset();
        checkSession(); // Arayüzü güncelle
    }
    btn.textContent = "Giriş Yap";
});

// 4. Çıkış Yap İşlemi
logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    updateUI(null);
});


// ============================================
// DİĞER ESKİ JS KODLARIN (DİL, KARTELA, MENÜ) 
// ============================================
// Eski index.html'nin altındaki <script> içindeki "DİL DEĞİŞTİRME SİSTEMİ", "CHATBOT MANTIĞI", "KARTELA & PDF MANTIĞI" gibi kodların hepsini aynen buranın altına yapıştırabilirsin. 

window.onclick = (e) => { 
    const modal = document.getElementById('kartela-modal');
    const chatModal = document.getElementById('chat-modal');
    const pdfModal = document.getElementById('pdf-modal');
    if(e.target == modal) modal.style.display = 'none'; 
    if(e.target == chatModal) chatModal.style.display = 'none';
    if(e.target == pdfModal) pdfModal.style.display = 'none';
    if(e.target == authModal) authModal.style.display = 'none'; // Auth modalı dışına tıklayınca kapanma eklendi
}

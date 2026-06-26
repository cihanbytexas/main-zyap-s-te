import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = "https://ppdwtpjglkphayfxexhv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwZHd0cGpnbGtwaGF5ZnhleGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNTc5ODEsImV4cCI6MjA5NjgzMzk4MX0.fJIyyxfU15EgrNARWkISFHJvU7-o-QpZbIKbRc3q_-s";
const supabase = createClient(supabaseUrl, supabaseKey);

let currentUserSession = null;
let currentFeedFilter = 'all';
let activeReplyData = {}; 
let selectedUpdateAvatarFile = null;
let currentlyViewingProfileId = null;
let currentChatUserId = null; 
let realtimeChannel = null;
let chatBroadcastChannel = null;
let typingTimeout;
let userDataGlobal = null;

// ============================================
// V4 PREMIUM TOAST BİLDİRİM SİSTEMİ
// ============================================
window.showToast = function(type, message) {
    const colors = type === 'success' ? 'bg-slate-900 text-white' : (type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-600 text-white');
    const icon = type === 'success' ? 'fa-circle-check' : (type === 'error' ? 'fa-circle-xmark' : 'fa-circle-info');
    
    const toast = document.createElement('div');
    toast.className = `fixed top-5 left-1/2 transform -translate-x-1/2 z-[999999] flex items-center gap-3 px-5 py-3.5 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.12)] transition-all duration-400 -translate-y-24 opacity-0 ${colors}`;
    toast.innerHTML = `<i class="fa-solid ${icon} text-lg"></i><span class="text-[14px] font-bold tracking-wide">${message}</span>`;
    
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
        toast.classList.remove('-translate-y-24', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
    });
    
    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('-translate-y-24', 'opacity-0');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
};

// ============================================
// MODAL FONKSİYONLARI VE TAM EKRAN GALERİ
// ============================================
window.openSideModal = function(wrapperId, panelId) {
    const wrapper = document.getElementById(wrapperId);
    const panel = document.getElementById(panelId);
    if(wrapper && panel) {
        document.body.style.overflow = 'hidden';
        wrapper.classList.remove('tw-modal-hidden');
        setTimeout(() => panel.classList.remove('translate-x-full', 'scale-95'), 10);
    }
}

window.closeSideModal = function(wrapperId, panelId) {
    const wrapper = document.getElementById(wrapperId);
    const panel = document.getElementById(panelId);
    if(wrapper && panel) {
        panel.classList.add('translate-x-full', 'scale-95');
        setTimeout(() => {
            wrapper.classList.add('tw-modal-hidden');
            document.body.style.overflow = '';
        }, 300);
    }
}

function showSimpleModal(modalEl) {
    if(modalEl) {
        document.body.style.overflow = 'hidden';
        modalEl.classList.remove('tw-modal-hidden');
    }
}

function hideSimpleModal(modalEl) {
    if(modalEl) {
        modalEl.classList.add('tw-modal-hidden');
        document.body.style.overflow = '';
    }
}

window.openGallery = function(imgUrl) {
    const imgEl = document.getElementById('gallery-image');
    const modal = document.getElementById('gallery-modal');
    const panel = document.getElementById('gallery-panel');
    if(imgEl && modal && panel) {
        imgEl.src = imgUrl;
        document.body.style.overflow = 'hidden';
        modal.classList.remove('tw-modal-hidden');
        setTimeout(() => panel.classList.remove('scale-95'), 10);
    }
}

// ============================================
// V4 REELS VİDEO & GÖRÜNTÜLENME MOTORU
// ============================================
window.togglePlay = function(container) {
    const video = container.querySelector('video');
    const playBtn = container.querySelector('.reels-play-btn');
    if(video.paused) {
        video.play();
        video.classList.remove('paused', 'manually-paused');
        playBtn.style.opacity = '0';
    } else {
        video.pause();
        video.classList.add('paused', 'manually-paused');
        playBtn.style.opacity = '1';
    }
};

window.toggleMute = function(e, btn) {
    e.stopPropagation();
    const video = btn.previousElementSibling.previousElementSibling;
    video.muted = !video.muted;
    btn.innerHTML = video.muted ? '<i class="fa-solid fa-volume-xmark"></i>' : '<i class="fa-solid fa-volume-high"></i>';
};

const reelsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const video = entry.target;
        const playBtn = video.nextElementSibling;
        if(entry.isIntersecting) {
            if(!video.classList.contains('manually-paused')) {
                video.play().catch(e => console.log('Auto-play engellendi', e));
                if(playBtn) playBtn.style.opacity = '0';
            }
        } else {
            video.pause();
            if(!video.classList.contains('manually-paused') && playBtn) playBtn.style.opacity = '1';
        }
    });
}, { threshold: 0.4 });

const viewedPosts = new Set();
const postViewObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if(entry.isIntersecting) {
            const postCard = entry.target;
            const postId = postCard.getAttribute('data-post-id');
            if(!viewedPosts.has(postId)) {
                viewedPosts.add(postId); 
                setTimeout(async () => {
                    try {
                        const {data} = await supabase.from('gonderiler').select('goruntulenme').eq('id', postId).single();
                        const currentViews = (data && data.goruntulenme) ? data.goruntulenme : 0;
                        const newViews = currentViews + 1;
                        await supabase.from('gonderiler').update({goruntulenme: newViews}).eq('id', postId);
                        const viewSpan = postCard.querySelector('.view-count-text');
                        if(viewSpan) viewSpan.innerText = newViews;
                    } catch(e){}
                }, 100);
            }
        }
    });
}, { threshold: 0.2 });

// ============================================
// OTURUM (SESSION) VE YÖNLENDİRME
// ============================================
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        currentUserSession = session;
        try {
            const { data: userData } = await supabase.from('uyeler').select('*').eq('id', session.user.id).single();
            if (userData) {
                userDataGlobal = userData; 
                const avatarUrl = userData.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.ad_soyad || 'U')}&background=1e3a8a&color=fff`;
                const bottomAvatar = document.getElementById('bottom-avatar');
                if(bottomAvatar) bottomAvatar.src = avatarUrl;
            }
        } catch (e) {}
        
        checkNotificationsBadge(); checkMessagesBadge(); setupRealtime(); loadFeed(currentFeedFilter);
    } else {
        window.location.href = 'index.html';
    }
}

window.handleLogout = async () => {
    if (realtimeChannel) supabase.removeChannel(realtimeChannel);
    if (chatBroadcastChannel) supabase.removeChannel(chatBroadcastChannel);
    await supabase.auth.signOut();
    window.location.href = 'index.html'; 
};

// ============================================
// V4 NAVIGATION BARI VE ARAMA
// ============================================
const bottomHomeBtn = document.getElementById('bottom-home-btn');
if(bottomHomeBtn) bottomHomeBtn.addEventListener('click', () => { window.scrollTo({top:0, behavior:'smooth'}); });

const bottomSearchBtn = document.getElementById('bottom-search-btn');
if(bottomSearchBtn) bottomSearchBtn.addEventListener('click', () => { openSideModal('search-modal', 'search-modal-panel'); });

const searchInput = document.getElementById('user-search-input');
if(searchInput) {
    searchInput.addEventListener('input', async (e) => {
        const val = e.target.value.trim();
        const resDiv = document.getElementById('search-results');
        if(!val) { 
            resDiv.innerHTML = '<div class="flex flex-col items-center justify-center h-40 text-slate-400"><i class="fa-solid fa-magnifying-glass text-5xl mb-3 opacity-30"></i><p class="text-[14px] font-bold">Aramak istediğiniz kişiyi yazın.</p></div>'; 
            return; 
        }
        
        try {
            const { data: users, error } = await supabase.from('uyeler').select('id, ad_soyad, avatar_url, rol, gizli_hesap').ilike('ad_soyad', `%${val}%`).limit(10);
            if(error) throw error;
            if(!users || users.length === 0) { resDiv.innerHTML = '<p class="text-center text-slate-400 mt-10 text-sm font-bold">Kullanıcı bulunamadı.</p>'; return; }
            
            resDiv.innerHTML = '';
            users.forEach(u => {
                const avatar = u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.ad_soyad || 'U')}`;
                resDiv.insertAdjacentHTML('beforeend', `
                    <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors user-profile-trigger border border-slate-100 shadow-sm" data-user-id="${u.id}" onclick="closeSideModal('search-modal', 'search-modal-panel')">
                        <img src="${avatar}" class="w-12 h-12 rounded-full object-cover border border-slate-200 pointer-events-none">
                        <div class="pointer-events-none flex-1">
                            <h4 class="font-bold text-slate-900 text-[14px] flex items-center gap-1">${u.ad_soyad} ${u.gizli_hesap ? '<i class="fa-solid fa-lock text-[10px] text-slate-400"></i>' : ''}</h4>
                            <span class="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase border border-blue-100">${u.rol}</span>
                        </div>
                    </div>
                `);
            });
        } catch(err) { resDiv.innerHTML = '<p class="text-center text-red-500 mt-10 text-sm">Arama hatası.</p>'; }
    });
}

const bottomAddBtn = document.getElementById('bottom-add-btn');
if(bottomAddBtn) bottomAddBtn.addEventListener('click', () => { 
    const createModal = document.getElementById('create-post-modal');
    if(createModal) {
        document.body.style.overflow = 'hidden';
        createModal.classList.remove('tw-modal-hidden');
        setTimeout(() => document.getElementById('create-post-panel').classList.remove('translate-y-full'), 10);
    }
});

document.getElementById('close-post-modal')?.addEventListener('click', () => {
    document.getElementById('create-post-panel').classList.add('translate-y-full');
    setTimeout(() => {
        document.getElementById('create-post-modal').classList.add('tw-modal-hidden');
        document.body.style.overflow = '';
    }, 300);
});

const bottomNotifBtn = document.getElementById('bottom-notif-btn');
if(bottomNotifBtn) bottomNotifBtn.addEventListener('click', () => { 
    openSideModal('notification-modal', 'notification-panel');
    loadNotifications();
});

const bottomProfileBtn = document.getElementById('bottom-profile-btn');
if(bottomProfileBtn) bottomProfileBtn.addEventListener('click', () => {
    if(currentUserSession) openUserProfile(currentUserSession.user.id);
});

// ============================================
// MODALLAR (Mesajlar / Profil Ayarları / Hareketlerin)
// ============================================
const messagesBtn = document.getElementById('messages-btn');
if(messagesBtn) messagesBtn.addEventListener('click', () => {
    openSideModal('messages-list-modal', 'messages-list-panel');
    loadConversations();
});

document.addEventListener('click', e => {
    const editMenuBtn = e.target.closest('#menu-edit-btn');
    if(editMenuBtn) {
        const editProfileModal = document.getElementById('edit-profile-modal');
        if(editProfileModal) showSimpleModal(editProfileModal);
        if(document.getElementById('edit-name') && userDataGlobal) document.getElementById('edit-name').value = userDataGlobal.ad_soyad || '';
        if(document.getElementById('edit-bio') && userDataGlobal) document.getElementById('edit-bio').value = userDataGlobal.biyografi || '';
        if(document.getElementById('edit-avatar-img') && userDataGlobal) document.getElementById('edit-avatar-img').src = userDataGlobal.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userDataGlobal.ad_soyad || 'U')}`;
        const pToggle = document.getElementById('privacy-toggle');
        if(pToggle && userDataGlobal.gizli_hesap !== undefined) pToggle.checked = !!userDataGlobal.gizli_hesap;
        selectedUpdateAvatarFile = null;
    }
    
    const activityMenuBtn = e.target.closest('#menu-activity-btn');
    if(activityMenuBtn) {
        openSideModal('activity-modal', 'activity-panel');
        loadActivity('likes');
    }
    
    const logoutMenuBtn = e.target.closest('#menu-logout-btn');
    if(logoutMenuBtn) handleLogout();
});

const cancelEditBtnTop = document.getElementById('cancel-edit-btn-top');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
if(cancelEditBtn) cancelEditBtn.addEventListener('click', () => { hideSimpleModal(document.getElementById('edit-profile-modal')); });
if(cancelEditBtnTop) cancelEditBtnTop.addEventListener('click', () => { hideSimpleModal(document.getElementById('edit-profile-modal')); });

const editAvatarInput = document.getElementById('edit-avatar');
if(editAvatarInput) {
    editAvatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            selectedUpdateAvatarFile = file;
            const reader = new FileReader();
            reader.onload = (ev) => { document.getElementById('edit-avatar-img').src = ev.target.result; };
            reader.readAsDataURL(file);
        }
    });
}

// Gizli Hesap ve Profil Güncelleme
const editProfileForm = document.getElementById('edit-profile-form');
if(editProfileForm) {
    editProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('save-edit-btn');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; btn.disabled = true;
        try {
            let updatedAvatarUrl = null;
            if (selectedUpdateAvatarFile) {
                const ext = selectedUpdateAvatarFile.name.split('.').pop();
                const fileName = `${currentUserSession.user.id}-${Math.random()}.${ext}`;
                await supabase.storage.from('avatars').upload(fileName, selectedUpdateAvatarFile);
                updatedAvatarUrl = supabase.storage.from('avatars').getPublicUrl(fileName).data.publicUrl;
            }
            const isPrivate = document.getElementById('privacy-toggle') ? document.getElementById('privacy-toggle').checked : false;
            
            const updateData = { ad_soyad: document.getElementById('edit-name').value, biyografi: document.getElementById('edit-bio').value, gizli_hesap: isPrivate };
            if (updatedAvatarUrl) updateData.avatar_url = updatedAvatarUrl;
            
            const { error: updateError } = await supabase.from('uyeler').update(updateData).eq('id', currentUserSession.user.id);
            if(updateError) throw updateError;
            
            if(userDataGlobal) {
                userDataGlobal.ad_soyad = updateData.ad_soyad;
                userDataGlobal.biyografi = updateData.biyografi;
                userDataGlobal.gizli_hesap = updateData.gizli_hesap;
                if (updatedAvatarUrl) userDataGlobal.avatar_url = updatedAvatarUrl;
            }

            hideSimpleModal(document.getElementById('edit-profile-modal'));
            showToast('success', 'Profil başarıyla güncellendi!');
            
            if(currentlyViewingProfileId === currentUserSession.user.id) {
                openUserProfile(currentUserSession.user.id);
            }
        } catch (error) { showToast('error', 'Güncellenemedi. Eksik tablo/sütun hatası olabilir.'); console.error(error); }
        finally { btn.innerHTML = 'Kaydet'; btn.disabled = false; }
    });
}

// ============================================
// HAREKETLERİN (ACTIVITY) YÜKLEMESİ VE DÜZELTİLMESİ
// ============================================
async function loadActivity(type) {
    const container = document.getElementById('activity-content');
    const tabLikes = document.getElementById('tab-activity-likes');
    const tabComments = document.getElementById('tab-activity-comments');
    
    if(!container || !currentUserSession) return;
    
    if(type === 'likes') {
        tabLikes.classList.add('border-slate-900', 'text-slate-900');
        tabLikes.classList.remove('border-transparent', 'text-slate-400');
        tabComments.classList.remove('border-slate-900', 'text-slate-900');
        tabComments.classList.add('border-transparent', 'text-slate-400');
        container.className = "flex-1 overflow-y-auto p-1 bg-white hide-scrollbar grid grid-cols-3 gap-[2px]";
        container.innerHTML = '<div class="col-span-3 text-center p-10"><i class="fa-solid fa-spinner fa-spin text-blue-500 text-3xl"></i></div>';
        
        const {data} = await supabase.from('etkilesimler').select('gonderi:gonderiler(id, medya_url, metin)').eq('user_id', currentUserSession.user.id).eq('etkilesim_tipi', 'like').order('created_at', {ascending: false});
        container.innerHTML = '';
        if(!data || data.length === 0) { container.innerHTML = '<div class="col-span-3 text-center p-10 text-[14px] font-bold text-slate-400">Henüz bir şey beğenmedin.</div>'; return; }
        
        data.forEach(item => {
            const post = item.gonderi;
            if(!post) return;
            let inner = '';
            if(post.medya_url) {
                if(post.medya_url.endsWith('.mp4')) inner = '<div class="absolute inset-0 bg-black flex items-center justify-center text-white"><i class="fa-solid fa-play text-2xl"></i></div>';
                else inner = `<img src="${post.medya_url}" class="w-full h-full object-cover">`;
            } else {
                inner = `<div class="w-full h-full bg-slate-100 flex items-center justify-center p-3 text-center text-[10px] font-bold text-slate-500 break-words overflow-hidden border border-slate-200">${post.metin.substring(0,40)}...</div>`;
            }
            // ID tırnak içine alındı (Hata çözümü)
            container.insertAdjacentHTML('beforeend', `<div class="aspect-square relative cursor-pointer hover:opacity-80 transition-opacity border border-white" onclick="openSinglePost('${post.id}')">${inner}</div>`);
        });
    } else {
        tabComments.classList.add('border-slate-900', 'text-slate-900');
        tabComments.classList.remove('border-transparent', 'text-slate-400');
        tabLikes.classList.remove('border-slate-900', 'text-slate-900');
        tabLikes.classList.add('border-transparent', 'text-slate-400');
        container.className = "flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 hide-scrollbar flex flex-col";
        container.innerHTML = '<div class="text-center p-10"><i class="fa-solid fa-spinner fa-spin text-blue-500 text-3xl"></i></div>';
        
        const {data} = await supabase.from('gonderi_yorumlari').select('*, gonderi:gonderiler(id, user_id, yazar:uyeler(ad_soyad, avatar_url))').eq('user_id', currentUserSession.user.id).order('created_at', {ascending: false});
        container.innerHTML = '';
        if(!data || data.length === 0) { container.innerHTML = '<div class="text-center p-10 text-[14px] font-bold text-slate-400">Hiç yorum yapmadın.</div>'; return; }
        
        data.forEach(comment => {
            const postOwner = comment.gonderi?.yazar?.ad_soyad || 'Biri';
            // ID tırnak içine alındı (Hata çözümü)
            container.insertAdjacentHTML('beforeend', `
                <div class="bg-white p-4 rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100 cursor-pointer hover:border-slate-300 transition-colors" onclick="openSinglePost('${comment.gonderi_id}')">
                    <p class="text-[12px] text-slate-400 font-bold mb-2"><i class="fa-solid fa-reply mr-1"></i> ${postOwner} kullanıcısının gönderisine</p>
                    <p class="text-[14px] font-medium text-slate-800 bg-slate-50 p-3 rounded-2xl border border-slate-100 break-words whitespace-pre-wrap">${comment.metin}</p>
                </div>
            `);
        });
    }
}
document.getElementById('tab-activity-likes')?.addEventListener('click', () => loadActivity('likes'));
document.getElementById('tab-activity-comments')?.addEventListener('click', () => loadActivity('comments'));

// ============================================
// REALTIME & CHAT BÖLÜMLERİ
// ============================================
function setupRealtime() {
    if (realtimeChannel) return;
    realtimeChannel = supabase.channel('oz-yapi-realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'gonderiler' }, async (payload) => {
            if (payload.new.user_id !== currentUserSession?.user?.id) {
                const { data: newPost } = await supabase.from('gonderiler').select(`*, yazar:uyeler(ad_soyad, avatar_url, rol, gizli_hesap), etkilesimler(id, user_id), gonderi_yorumlari(id, metin, created_at, user_id, ust_yorum_id, yazar:uyeler(ad_soyad, avatar_url, rol))`).eq('id', payload.new.id).single();
                
                let showPost = true;
                if(newPost && newPost.yazar && newPost.yazar.gizli_hesap) {
                    const { data: follow } = await supabase.from('takipler').select('id').eq('takip_eden_id', currentUserSession.user.id).eq('takip_edilen_id', newPost.user_id).maybeSingle();
                    if(!follow) showPost = false;
                }

                if (showPost && newPost && (currentFeedFilter === 'all' || currentFeedFilter === newPost.gonderi_tipi)) {
                    const feedList = document.getElementById('feed-list');
                    if (feedList) {
                        feedList.insertAdjacentHTML('afterbegin', generatePostHTML(newPost, false));
                        const newCard = feedList.firstElementChild;
                        if(newCard) postViewObserver.observe(newCard);
                        const newVideo = newCard.querySelector('video');
                        if(newVideo) reelsObserver.observe(newVideo);
                    }
                }
            }
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bildirimler' }, (payload) => {
            if (payload.new.alici_id === currentUserSession?.user?.id) {
                const bottomNotifBadge = document.querySelector('#bottom-notif-btn #notification-badge');
                if(bottomNotifBadge) bottomNotifBadge.classList.remove('hidden');
                showToast('info', 'Yeni bir bildirimin var!');
            }
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
                        const messagesListModal = document.getElementById('messages-list-modal');
                        if (messagesListModal && !messagesListModal.classList.contains('tw-modal-hidden')) loadConversations();
                        else showToast('info', 'Yeni bir mesajın var!');
                    }
                } 
                else if (payload.eventType === 'UPDATE') {
                    const bubbleWrapper = document.getElementById(`msg-wrapper-${payload.new.id}`);
                    if (bubbleWrapper) {
                        const bubble = bubbleWrapper.querySelector('.msg-bubble');
                        const heart = bubbleWrapper.querySelector('.msg-heart');
                        if(bubble) bubble.setAttribute('data-is-liked', payload.new.begendi.toString());
                        if (payload.new.begendi) { if(heart) { heart.classList.remove('scale-0', 'opacity-0'); heart.classList.add('scale-100', 'opacity-100'); } } 
                        else { if(heart) { heart.classList.remove('scale-100', 'opacity-100'); heart.classList.add('scale-0', 'opacity-0'); } }
                        const readIcon = bubbleWrapper.querySelector('.msg-read-status');
                        if (readIcon && payload.new.okundu) readIcon.className = 'msg-read-status fa-solid fa-check-double text-blue-500 ml-1.5 text-[11px]';
                    }
                    const messagesListModal = document.getElementById('messages-list-modal');
                    if (messagesListModal && !messagesListModal.classList.contains('tw-modal-hidden')) loadConversations();
                } 
                else if (payload.eventType === 'DELETE') {
                    const wrapper = document.getElementById(`msg-wrapper-${payload.old.id}`);
                    if(wrapper) wrapper.remove();
                    const messagesListModal = document.getElementById('messages-list-modal');
                    if (messagesListModal && !messagesListModal.classList.contains('tw-modal-hidden')) loadConversations();
                }
            }
        }).subscribe();

    if(!chatBroadcastChannel) {
        chatBroadcastChannel = supabase.channel('chat-typing');
        chatBroadcastChannel.on('broadcast', { event: 'typing' }, payload => {
            const dmModal = document.getElementById('dm-modal');
            if (payload.payload.to === currentUserSession.user.id && payload.payload.from === currentChatUserId && dmModal && !dmModal.classList.contains('tw-modal-hidden')) {
                const dmTypingIndicator = document.getElementById('chat-typing-indicator');
                if(dmTypingIndicator) {
                    dmTypingIndicator.classList.remove('hidden'); dmTypingIndicator.classList.add('flex');
                    scrollToChatBottom(); clearTimeout(typingTimeout);
                    typingTimeout = setTimeout(() => { dmTypingIndicator.classList.remove('flex'); dmTypingIndicator.classList.add('hidden'); }, 2000);
                }
            }
        }).subscribe();
    }
}

// --- ZENGİN BİLDİRİMLER (RICH NOTIFICATIONS) VE İSTEK MANTIĞI ---
async function checkNotificationsBadge() {
    if (!currentUserSession) return;
    const bottomNotifBadge = document.querySelector('#bottom-notif-btn #notification-badge');
    try {
        const { count } = await supabase.from('bildirimler').select('*', { count: 'exact', head: true }).eq('alici_id', currentUserSession.user.id).eq('okundu', false);
        if (count > 0) bottomNotifBadge?.classList.remove('hidden'); else bottomNotifBadge?.classList.add('hidden');
    } catch (error) {}
}

async function loadNotifications() {
    const notificationList = document.getElementById('notification-list');
    if(!notificationList) return;
    notificationList.innerHTML = '<div class="text-center text-slate-400 mt-10"><i class="fa-solid fa-spinner fa-spin text-3xl mb-2 text-blue-500"></i><br>Yükleniyor...</div>';
    try {
        const { data: notifications } = await supabase.from('bildirimler').select('*, gonderen:uyeler!gonderen_id(ad_soyad, avatar_url), gonderi:gonderiler(medya_url, metin)').eq('alici_id', currentUserSession.user.id).order('created_at', { ascending: false }).limit(30);
        if (!notifications || notifications.length === 0) { notificationList.innerHTML = '<div class="flex flex-col items-center justify-center h-40 text-slate-400"><i class="fa-regular fa-bell text-5xl mb-3 opacity-30"></i><p class="font-bold text-[14px]">Bildirim yok.</p></div>'; return; }
        
        notificationList.innerHTML = '';
        notifications.forEach(notif => {
            const sender = notif.gonderen || {};
            const avatar = sender.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(sender.ad_soyad || 'U')}&background=1e3a8a&color=fff`;
            const dotClass = notif.okundu ? 'hidden' : 'block';
            const postIdParam = notif.gonderi_id ? `'${notif.gonderi_id}'` : 'null';
            const senderIdParam = notif.gonderen_id ? `'${notif.gonderen_id}'` : 'null';
            
            let richText = notif.mesaj;
            let actionButtons = '';
            
            if(notif.mesaj.includes('gönderine yorum yaptı:')) {
                const parts = notif.mesaj.split('gönderine yorum yaptı:');
                richText = `<span class="text-slate-500 font-normal">gönderine yorum yaptı:</span> <span class="text-slate-700 italic">"${parts[1] ? parts[1].trim() : '...'}"</span>`;
            }
            else if(notif.mesaj === 'gönderine yorum yaptı') {
                richText = `<span class="text-slate-500 font-normal">gönderine yorum yaptı</span>`;
            }
            else if(notif.mesaj.includes('beğendi')) {
                richText = `<span class="text-slate-500 font-normal">gönderini beğendi <i class="fa-solid fa-heart text-red-500 ml-1"></i></span>`;
            }
            else if(notif.mesaj === 'seni takip etmek istiyor') {
                richText = `<span class="text-slate-900 font-bold">seni takip etmek istiyor</span>`;
                actionButtons = `
                    <div class="flex gap-2 mt-2">
                        <button onclick="answerFollowRequest(event, ${notif.id}, '${notif.gonderen_id}', 'accept')" class="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition-transform">Onayla</button>
                        <button onclick="answerFollowRequest(event, ${notif.id}, '${notif.gonderen_id}', 'reject')" class="bg-slate-100 text-slate-700 px-4 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition-transform">Sil</button>
                    </div>
                `;
            }
            else if(notif.mesaj.includes('takip etmeye') || notif.mesaj.includes('onayladı')) {
                richText = `<span class="text-blue-600 font-bold">${notif.mesaj}</span>`;
            }

            let thumbHtml = '';
            if(notif.gonderi_id && notif.gonderi && !actionButtons) {
                if(notif.gonderi.medya_url) thumbHtml = `<img src="${notif.gonderi.medya_url}" class="w-14 h-14 object-cover rounded-xl border border-slate-200 ml-3 shadow-sm">`;
                else if(notif.gonderi.metin) thumbHtml = `<div class="w-14 h-14 bg-slate-50 flex items-center justify-center rounded-xl border border-slate-200 ml-3 text-[9px] text-slate-500 p-1.5 text-center overflow-hidden break-words font-bold shadow-sm">${notif.gonderi.metin.substring(0,25)}</div>`;
            }

            // ID tırnak içine alındı
            notificationList.insertAdjacentHTML('beforeend', `
                <div class="p-3.5 rounded-2xl flex items-center justify-between relative cursor-pointer hover:bg-slate-50 bg-white border-b border-slate-50 transition-colors ${notif.okundu ? '' : 'bg-blue-50/40'}" onclick="handleNotificationClick('${notif.id}', ${postIdParam}, ${senderIdParam})">
                    <span class="absolute top-1/2 left-1.5 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full ${dotClass}"></span>
                    <div class="flex items-start gap-3 flex-1 pl-3">
                        <img src="${avatar}" class="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-slate-100 shadow-sm mt-0.5">
                        <div class="text-[14px] text-slate-800 leading-snug flex-1">
                            <span class="font-extrabold">${sender.ad_soyad}</span> <br> ${richText}
                            ${actionButtons}
                        </div>
                    </div>
                    ${thumbHtml}
                </div>
            `);
        });
    } catch (error) {}
}

window.handleNotificationClick = async (notificationId, postId, senderId) => {
    await supabase.from('bildirimler').update({ okundu: true }).eq('id', notificationId);
    closeSideModal('notification-modal', 'notification-panel'); 
    checkNotificationsBadge();
    if (postId && postId !== 'null' && postId !== 'undefined') openSinglePost(postId);
    else if (senderId && senderId !== 'null') openUserProfile(senderId);
};

window.answerFollowRequest = async (e, notifId, senderId, action) => {
    e.stopPropagation(); 
    const btn = e.target;
    const originalText = btn.innerText;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    btn.disabled = true;

    try {
        if (action === 'accept') {
            const { error: err } = await supabase.from('takipler').insert([{ takip_eden_id: senderId, takip_edilen_id: currentUserSession.user.id }]);
            if(err) throw err;
            await supabase.from('bildirimler').insert([{ alici_id: senderId, gonderen_id: currentUserSession.user.id, mesaj: 'takip isteğini onayladı' }]);
            await supabase.from('bildirimler').update({ mesaj: 'seni takip etmeye başladı', okundu: true }).eq('id', notifId);
            showToast('success', 'İstek onaylandı.');
        } else {
            await supabase.from('bildirimler').delete().eq('id', notifId);
            showToast('info', 'İstek reddedildi.');
        }
        await supabase.from('takip_istekleri').delete().eq('gonderen_id', senderId).eq('alici_id', currentUserSession.user.id);
        loadNotifications();
    } catch (error) {
        showToast('error', 'İşlem başarısız oldu.');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

// --- Mesajlaşma (DM) VE OPTİMİSTİC UI EKLENTİSİ ---
async function checkMessagesBadge() {
    if (!currentUserSession) return;
    const messagesBadge = document.querySelector('#messages-btn #messages-badge');
    if(!messagesBadge) return;
    try {
        const { count } = await supabase.from('mesajlar').select('*', { count: 'exact', head: true }).eq('alici_id', currentUserSession.user.id).eq('okundu', false);
        if (count > 0) messagesBadge.classList.remove('hidden'); else messagesBadge.classList.add('hidden');
    } catch (error) {}
}

async function loadConversations() {
    const conversationsList = document.getElementById('conversations-list');
    if(!conversationsList) return;
    conversationsList.innerHTML = '<div class="text-center text-slate-400 mt-10"><i class="fa-solid fa-spinner fa-spin text-3xl mb-2 text-blue-500"></i></div>';
    try {
        const { data: msgs, error } = await supabase.from('mesajlar').select('*, gonderen:uyeler!gonderen_id(id, ad_soyad, avatar_url), alici:uyeler!alici_id(id, ad_soyad, avatar_url)').or(`gonderen_id.eq.${currentUserSession.user.id},alici_id.eq.${currentUserSession.user.id}`).order('created_at', { ascending: false });
        if (error) throw error;
        if (!msgs || msgs.length === 0) { conversationsList.innerHTML = '<div class="flex flex-col items-center justify-center h-40 text-slate-400"><i class="fa-brands fa-facebook-messenger text-5xl mb-3 opacity-30"></i><p class="font-bold text-[14px]">Mesaj kutunuz boş.</p></div>'; return; }

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
            const bgClass = c.isUnread ? 'bg-blue-50/50 border-blue-100' : 'bg-white border-slate-100';
            const textWeight = c.isUnread ? 'font-extrabold text-slate-900' : 'font-medium text-slate-500';
            
            conversationsList.insertAdjacentHTML('beforeend', `
                <div class="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors border ${bgClass} rounded-2xl mx-1 my-2 shadow-sm" onclick="openChat('${c.user.id}', '${c.user.ad_soyad}', '${avatar}')">
                    <img src="${avatar}" class="w-14 h-14 rounded-full object-cover flex-shrink-0 border border-slate-200 pointer-events-none">
                    <div class="flex-1 overflow-hidden pointer-events-none">
                        <div class="font-bold text-[15px] text-slate-900">${c.user.ad_soyad}</div>
                        <div class="text-[14px] truncate mt-0.5 ${textWeight}">${c.senderLabel}${c.lastMsg}</div>
                    </div>
                    ${c.isUnread ? '<span class="w-3 h-3 bg-blue-500 rounded-full pointer-events-none shadow-sm"></span>' : ''}
                </div>
            `);
        });
    } catch (error) {}
}

window.openChat = async (targetId, targetName, targetAvatar) => {
    currentChatUserId = targetId;
    const dmUserName = document.getElementById('chat-user-name');
    const dmUserAvatar = document.getElementById('chat-user-avatar');
    if(dmUserName) dmUserName.innerText = targetName; 
    if(dmUserAvatar) dmUserAvatar.src = targetAvatar;
    if(dmUserAvatar) dmUserAvatar.setAttribute('data-user-id', targetId); 
    if(dmUserName) dmUserName.setAttribute('data-user-id', targetId);
    
    openSideModal('dm-modal', 'dm-panel');
    const dmHistory = document.getElementById('chat-history');
    if(dmHistory) dmHistory.innerHTML = '<div class="flex-1 flex items-center justify-center"><i class="fa-solid fa-spinner fa-spin text-3xl text-blue-500"></i></div>';

    try {
        await supabase.from('mesajlar').update({ okundu: true }).eq('alici_id', currentUserSession.user.id).eq('gonderen_id', targetId).eq('okundu', false);
        checkMessagesBadge();
        const messagesListModal = document.getElementById('messages-list-modal');
        if(messagesListModal && !messagesListModal.classList.contains('tw-modal-hidden')) loadConversations();

        const { data: history, error } = await supabase.from('mesajlar').select('*').in('gonderen_id', [currentUserSession.user.id, targetId]).in('alici_id', [currentUserSession.user.id, targetId]).order('created_at', { ascending: true });
        if (error) throw error;

        if(dmHistory) dmHistory.innerHTML = '';
        if (history && history.length > 0) {
            history.forEach(msg => appendMessageToUI(msg, msg.gonderen_id === currentUserSession.user.id));
        } else {
            if(dmHistory) dmHistory.innerHTML = '<div class="flex-1 flex flex-col items-center justify-center opacity-40"><i class="fa-regular fa-paper-plane text-6xl mb-4"></i><p id="empty-chat-msg" class="font-extrabold text-[15px]">İlk mesajı sen gönder!</p></div>';
        }
        scrollToChatBottom();
    } catch (error) { if(dmHistory) dmHistory.innerHTML = '<p class="text-center text-red-500 mt-10 font-bold">Sohbet yüklenemedi.</p>'; }
};

function appendMessageToUI(msg, isMine) {
    const emptyMsg = document.getElementById('empty-chat-msg');
    if (emptyMsg) emptyMsg.parentElement.remove();
    const dmHistory = document.getElementById('chat-history');
    if (!dmHistory) return;

    if (document.getElementById(`msg-wrapper-${msg.id}`)) return; 

    const timeStr = new Date(msg.created_at).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});
    const mediaHtml = msg.medya_url ? `<img src="${msg.medya_url}" class="w-full max-w-[220px] h-auto rounded-xl mb-1 pointer-events-auto cursor-pointer border border-slate-100 shadow-sm" onclick="openGallery('${msg.medya_url}')">` : '';
    const textHtml = (msg.metin && msg.metin !== '📷 Görsel') ? `<div class="whitespace-pre-wrap break-words leading-relaxed">${msg.metin}</div>` : '';
    const readHtml = isMine ? `<i class="msg-read-status fa-solid ${msg.okundu ? 'fa-check-double text-blue-300' : 'fa-check text-white/50'} ml-1.5 text-[11px]"></i>` : '';
    const heartClass = msg.begendi ? 'scale-100 opacity-100' : 'scale-0 opacity-0';

    if (isMine) {
        dmHistory.insertAdjacentHTML('beforeend', `
            <div class="flex flex-col items-end w-full animate-fade-in relative mb-5" id="msg-wrapper-${msg.id}">
                <div class="msg-bubble relative bg-slate-900 text-white px-4 py-3 rounded-2xl rounded-br-sm max-w-[80%] text-[15px] shadow-sm cursor-pointer select-none border border-slate-800" data-msg-id="${msg.id}" data-is-mine="true" data-is-liked="${!!msg.begendi}">
                    ${mediaHtml}${textHtml}
                    <div class="msg-heart absolute -bottom-3 -left-3 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md border border-slate-100 transition-all duration-300 ${heartClass}"><i class="fa-solid fa-heart text-red-500 text-[14px]"></i></div>
                </div>
                <div class="flex items-center text-[11px] text-slate-400 mt-1 font-bold mr-1"><span>${timeStr}</span>${readHtml}</div>
            </div>
        `);
    } else {
        const dmUserAvatar = document.getElementById('chat-user-avatar');
        const avatarSrc = dmUserAvatar ? dmUserAvatar.src : '';
        dmHistory.insertAdjacentHTML('beforeend', `
            <div class="flex items-end gap-2.5 w-full animate-fade-in relative mb-5" id="msg-wrapper-${msg.id}">
                <img src="${avatarSrc}" class="w-8 h-8 rounded-full object-cover mb-5 border border-slate-200 shadow-sm">
                <div class="flex flex-col items-start w-full">
                    <div class="msg-bubble relative bg-white border border-slate-200 text-slate-800 px-4 py-3 rounded-2xl rounded-bl-sm max-w-[80%] text-[15px] shadow-sm cursor-pointer select-none" data-msg-id="${msg.id}" data-is-mine="false" data-is-liked="${!!msg.begendi}">
                        ${mediaHtml}${textHtml}
                        <div class="msg-heart absolute -bottom-3 -right-3 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md border border-slate-100 transition-all duration-300 ${heartClass}"><i class="fa-solid fa-heart text-red-500 text-[14px]"></i></div>
                    </div>
                    <span class="text-[11px] text-slate-400 mt-1 ml-2 font-bold">${timeStr}</span>
                </div>
            </div>
        `);
    }
    scrollToChatBottom();
}

function scrollToChatBottom() { 
    const dmHistory = document.getElementById('chat-history');
    if(dmHistory) dmHistory.scrollTop = dmHistory.scrollHeight; 
}

const dmInput = document.getElementById('dm-input');
if(dmInput) {
    dmInput.addEventListener('input', () => {
        if(currentChatUserId && chatBroadcastChannel) {
            chatBroadcastChannel.send({ type: 'broadcast', event: 'typing', payload: { from: currentUserSession.user.id, to: currentChatUserId } });
        }
    });
}

const dmForm = document.getElementById('dm-form');
if(dmForm) {
    dmForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = dmInput.value.trim();
        if (!currentChatUserId || !text) return;
        dmInput.value = ''; 
        
        const tempId = 'temp-' + Date.now();
        appendMessageToUI({
            id: tempId,
            created_at: new Date().toISOString(),
            metin: text,
            okundu: false,
            begendi: false,
            gonderen_id: currentUserSession.user.id
        }, true);

        try {
            const { data, error } = await supabase.from('mesajlar').insert([{ gonderen_id: currentUserSession.user.id, alici_id: currentChatUserId, metin: text }]).select().single();
            if (error) throw error;
            
            const tempWrapper = document.getElementById(`msg-wrapper-${tempId}`);
            if (tempWrapper) {
                tempWrapper.id = `msg-wrapper-${data.id}`;
                const bubble = tempWrapper.querySelector('.msg-bubble');
                if (bubble) bubble.setAttribute('data-msg-id', data.id);
            }
            
            const messagesListModal = document.getElementById('messages-list-modal');
            if(messagesListModal && !messagesListModal.classList.contains('tw-modal-hidden')) loadConversations();
        } catch (err) { 
            showToast('error', 'Mesaj iletilemedi.'); 
            const tempWrapper = document.getElementById(`msg-wrapper-${tempId}`);
            if (tempWrapper) tempWrapper.remove();
        }
    });
}

const dmMediaInput = document.getElementById('chat-media-input');
if(dmMediaInput) {
    dmMediaInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        const dmHistory = document.getElementById('chat-history');
        if(!file || !currentChatUserId || !dmHistory) return;
        e.target.value = ''; 
        
        const tempId = 'temp-' + Date.now();
        dmHistory.insertAdjacentHTML('beforeend', `<div class="text-center font-bold text-[13px] text-blue-500 my-2" id="msg-wrapper-${tempId}"><i class="fa-solid fa-spinner fa-spin"></i> Gönderiliyor...</div>`);
        scrollToChatBottom();
        
        try {
            const ext = file.name.split('.').pop();
            const fileName = `dm-${Date.now()}.${ext}`;
            const { error: uploadError } = await supabase.storage.from('medya').upload(fileName, file);
            if(uploadError) throw uploadError;
            const finalMediaUrl = supabase.storage.from('medya').getPublicUrl(fileName).data.publicUrl;
            
            const { data, error } = await supabase.from('mesajlar').insert([{ gonderen_id: currentUserSession.user.id, alici_id: currentChatUserId, metin: '📷 Görsel', medya_url: finalMediaUrl }]).select().single();
            if(error) throw error;
            
            const tempWrapper = document.getElementById(`msg-wrapper-${tempId}`);
            if (tempWrapper) tempWrapper.remove();
            appendMessageToUI(data, true);
        } catch(err) { 
            showToast('error', 'Görsel gönderilemedi'); 
            const tempWrapper = document.getElementById(`msg-wrapper-${tempId}`);
            if (tempWrapper) tempWrapper.remove();
        } 
    });
}

// ============================================
// DOSYA/KAMERA SEÇİCİ VE GÖNDERİ PAYLAŞIM
// ============================================
const postTypeRadios = document.getElementsByName('post_type');
if(postTypeRadios) {
    postTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const mediaUploadContainer = document.getElementById('media-upload-container');
            const mediaPreviewContainer = document.getElementById('media-preview-container');
            const postMediaC = document.getElementById('post-media-camera');
            const postMediaG = document.getElementById('post-media-gallery');
            
            if(e.target.value === 'medya') { if(mediaUploadContainer) mediaUploadContainer.classList.remove('tw-modal-hidden'); }
            else { 
                if(mediaUploadContainer) mediaUploadContainer.classList.add('tw-modal-hidden'); 
                if(postMediaC) postMediaC.value = ''; 
                if(postMediaG) postMediaG.value = ''; 
                if(mediaPreviewContainer) { mediaPreviewContainer.classList.add('hidden'); mediaPreviewContainer.classList.remove('flex'); }
            }
        });
    });
}

const handleMediaSelect = (e) => {
    const file = e.target.files[0];
    const previewContainer = document.getElementById('media-preview-container');
    const previewName = document.getElementById('media-preview-name');
    if(file && previewContainer && previewName) {
        previewName.textContent = file.name;
        previewContainer.classList.remove('hidden');
        previewContainer.classList.add('flex');
    }
};

document.getElementById('post-media-camera')?.addEventListener('change', handleMediaSelect);
document.getElementById('post-media-gallery')?.addEventListener('change', handleMediaSelect);

document.getElementById('clear-media-btn')?.addEventListener('click', () => {
    const c = document.getElementById('post-media-camera');
    const g = document.getElementById('post-media-gallery');
    if(c) c.value = ''; if(g) g.value = '';
    const container = document.getElementById('media-preview-container');
    if(container) { container.classList.add('hidden'); container.classList.remove('flex'); }
});

const createPostForm = document.getElementById('create-post-form');
if(createPostForm) {
    createPostForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitPostBtn = document.getElementById('submit-post-btn');
        const postTextInput = document.getElementById('post-text');
        submitPostBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Paylaşılıyor...'; submitPostBtn.disabled = true;
        try {
            let finalMediaUrl = null;
            const typeValue = document.querySelector('input[name="post_type"]:checked').value;
            
            if (typeValue === 'medya') {
                const cFile = document.getElementById('post-media-camera')?.files[0];
                const gFile = document.getElementById('post-media-gallery')?.files[0];
                const file = cFile || gFile;
                
                if(file) {
                    const ext = file.name.split('.').pop();
                    const fileName = `post-${Date.now()}.${ext}`;
                    await supabase.storage.from('medya').upload(fileName, file);
                    finalMediaUrl = supabase.storage.from('medya').getPublicUrl(fileName).data.publicUrl;
                }
            }

            const { data: newPost, error: insertErr } = await supabase.from('gonderiler').insert([{ user_id: currentUserSession.user.id, gonderi_tipi: typeValue, metin: postTextInput.value, medya_url: finalMediaUrl }]).select().single();
            if (insertErr) throw insertErr;

            const { data: followers } = await supabase.from('takipler').select('takip_eden_id').eq('takip_edilen_id', currentUserSession.user.id);
            if (followers && followers.length > 0) {
                const notifications = followers.map(f => ({ alici_id: f.takip_eden_id, gonderen_id: currentUserSession.user.id, mesaj: 'yeni bir gönderi paylaştı.', gonderi_id: newPost.id }));
                await supabase.from('bildirimler').insert(notifications);
            }

            document.getElementById('create-post-panel').classList.add('translate-y-full');
            showToast('success', 'İçerik başarıyla paylaşıldı!');
            
            setTimeout(() => {
                document.getElementById('create-post-modal').classList.add('tw-modal-hidden');
                document.body.style.overflow = '';
                createPostForm.reset(); 
                document.getElementById('clear-media-btn')?.click();
                const mediaUploadContainer = document.getElementById('media-upload-container');
                if(mediaUploadContainer) mediaUploadContainer.classList.add('tw-modal-hidden');
                loadFeed(currentFeedFilter);
            }, 350);

        } catch (error) { showToast('error', 'Paylaşım hatası!'); } 
        finally { submitPostBtn.innerHTML = 'Paylaş'; submitPostBtn.disabled = false; }
    });
}

const feedFilters = document.querySelectorAll('.feed-filter');
if(feedFilters) {
    feedFilters.forEach(btn => {
        btn.addEventListener('click', (e) => {
            feedFilters.forEach(f => f.className = "feed-filter px-5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-[13px] font-bold transition-all shadow-sm outline-none");
            e.target.className = "feed-filter active px-5 py-2.5 rounded-2xl bg-slate-900 text-white text-[13px] font-bold transition-all shadow-md border-none outline-none";
            currentFeedFilter = e.target.getAttribute('data-filter');
            loadFeed(currentFeedFilter);
        });
    });
}

// ============================================
// TEMPLATE ÜRETİMİ
// ============================================
function generatePostHTML(post, isSingleView = false) {
    const author = post.yazar || {};
    const avatar = author.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.ad_soyad || 'U')}&background=1e3a8a&color=fff`;
    const likesCount = post.etkilesimler ? post.etkilesimler.length : 0;
    const isLikedByMe = post.etkilesimler && currentUserSession ? post.etkilesimler.some(e => e.user_id === currentUserSession.user.id) : false;
    const viewCount = post.goruntulenme || 0;
    
    let postOptionsHTML = '';
    if (currentUserSession && currentUserSession.user.id === post.user_id) {
        const canEdit = ((new Date() - new Date(post.created_at)) / (1000 * 60)) <= 15;
        postOptionsHTML = `
            <div class="relative group ml-auto">
                <button class="text-slate-400 p-2 outline-none border-none bg-transparent hover:text-slate-800 transition-colors active:scale-90"><i class="fa-solid fa-ellipsis-vertical pointer-events-none text-lg"></i></button>
                <div class="absolute right-0 mt-1 w-36 bg-white border border-slate-100 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 overflow-hidden py-1">
                    ${canEdit ? `<button class="edit-post-btn w-full text-left px-5 py-3.5 text-[14px] text-slate-800 hover:bg-slate-50 outline-none border-none bg-transparent font-extrabold flex items-center gap-2" data-post-id="${post.id}" data-text="${encodeURIComponent(post.metin)}"><i class="fa-solid fa-pen w-4"></i> Düzenle</button><div class="h-px bg-slate-100 mx-3"></div>` : ''}
                    <button class="delete-post-btn w-full text-left px-5 py-3.5 text-[14px] text-red-600 hover:bg-red-50 outline-none border-none bg-transparent font-extrabold flex items-center gap-2" data-post-id="${post.id}"><i class="fa-solid fa-trash-can w-4"></i> Sil</button>
                </div>
            </div>
        `;
    }

    let commentsHTML = '';
    const allComments = post.gonderi_yorumlari || [];
    
    allComments.filter(c => !c.ust_yorum_id).forEach(comment => {
        const cAuthor = comment.yazar || {};
        const cAvatar = cAuthor.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(cAuthor.ad_soyad || 'U')}`;
        let cOptions = (currentUserSession && currentUserSession.user.id === comment.user_id) ? `<button class="delete-comment-btn hover:text-red-500 ml-2 outline-none border-none bg-transparent" data-comment-id="${comment.id}">Sil</button>` : '';

        commentsHTML += `
            <div class="flex gap-3 items-start mt-4 w-full">
                <img src="${cAvatar}" class="w-9 h-9 rounded-full object-cover border border-slate-200 cursor-pointer user-profile-trigger shadow-sm flex-shrink-0" data-user-id="${comment.user_id}" loading="lazy">
                <div class="flex-1 min-w-0">
                    <div class="bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-2xl rounded-tl-sm inline-block max-w-full shadow-sm">
                        <span class="font-extrabold text-[14px] text-slate-900 mr-2 cursor-pointer hover:underline user-profile-trigger block sm:inline" data-user-id="${comment.user_id}">${cAuthor.ad_soyad}</span>
                        <span class="text-[14px] text-slate-800 break-words whitespace-pre-wrap font-medium">${comment.metin}</span>
                    </div>
                    <div class="flex gap-3 mt-1.5 ml-2 text-[11px] text-slate-400 font-extrabold">
                        <button class="reply-to-comment-btn hover:text-slate-800 outline-none border-none bg-transparent transition-colors" data-post-id="${post.id}" data-comment-id="${comment.id}" data-author-name="${cAuthor.ad_soyad}">Yanıtla</button>${cOptions}
                    </div>
        `;

        allComments.filter(r => r.ust_yorum_id === comment.id).forEach(reply => {
            const rAuthor = reply.yazar || {};
            const rAvatar = rAuthor.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(rAuthor.ad_soyad || 'U')}`;
            let rOptions = (currentUserSession && currentUserSession.user.id === reply.user_id) ? `<button class="delete-comment-btn hover:text-red-500 ml-2 outline-none border-none bg-transparent" data-comment-id="${reply.id}">Sil</button>` : '';

            commentsHTML += `
                <div class="flex gap-2.5 items-start mt-3 w-full">
                    <img src="${rAvatar}" class="w-7 h-7 rounded-full object-cover border border-slate-200 cursor-pointer user-profile-trigger shadow-sm flex-shrink-0" data-user-id="${reply.user_id}" loading="lazy">
                    <div class="flex-1 min-w-0">
                        <div class="bg-slate-50 border border-slate-100 px-3.5 py-2 rounded-2xl rounded-tl-sm inline-block max-w-full shadow-sm">
                            <span class="font-extrabold text-[13px] text-slate-900 mr-1.5 cursor-pointer hover:underline user-profile-trigger block sm:inline" data-user-id="${reply.user_id}">${rAuthor.ad_soyad}</span>
                            <span class="text-[14px] text-slate-800 break-words whitespace-pre-wrap font-medium">${reply.metin}</span>
                        </div>
                        <div class="flex gap-2 mt-1.5 ml-2 text-[10px] text-slate-400 font-extrabold">${rOptions}</div>
                    </div>
                </div>
            `;
        });
        commentsHTML += '</div></div>';
    });

    let mediaHTML = '';
    if (post.gonderi_tipi === 'medya' && post.medya_url) {
        if (post.medya_url.endsWith('.mp4')) {
            mediaHTML = `
                <div class="reels-video-container mt-4 cursor-pointer group premium-shadow" onclick="togglePlay(this)">
                    <video class="reels-video" loop muted playsinline data-post-id="${post.id}">
                        <source src="${post.medya_url}" type="video/mp4">
                    </video>
                    <div class="reels-play-btn"><i class="fa-solid fa-play ml-1"></i></div>
                    <div class="reels-mute-btn" onclick="toggleMute(event, this)"><i class="fa-solid fa-volume-xmark"></i></div>
                </div>
            `;
        } else {
            mediaHTML = `
                <div class="relative mt-4 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 premium-shadow group">
                    <img src="${post.medya_url}" class="post-media-item w-full h-auto max-h-[70vh] object-cover pointer-events-auto cursor-pointer" onclick="openGallery('${post.medya_url}')" data-post-id="${post.id}" data-author-id="${post.user_id}" loading="lazy">
                    <i class="fa-solid fa-heart absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-7xl opacity-0 pointer-events-none drop-shadow-2xl z-10 big-heart"></i>
                    <div class="absolute bottom-3 right-3 bg-black/60 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg backdrop-blur-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5"><i class="fa-solid fa-expand"></i> Büyüt</div>
                </div>
            `;
        }
    }

    return `
        <div class="post-card no-select bg-white p-5 rounded-[24px] transition-all duration-300 mb-6" data-post-id="${post.id}">
            <div class="flex justify-between items-start mb-4 pointer-events-auto">
                <div class="flex items-center gap-3">
                    <img src="${avatar}" class="w-12 h-12 rounded-full object-cover border-[1.5px] border-slate-200 cursor-pointer user-profile-trigger shadow-sm" data-user-id="${post.user_id}" loading="lazy">
                    <div>
                        <h4 class="font-extrabold text-slate-900 text-[15px] flex items-center gap-2 cursor-pointer hover:underline user-profile-trigger" data-user-id="${post.user_id}">
                            ${author.ad_soyad || 'Bilinmeyen'}
                            <span class="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] uppercase tracking-wider font-extrabold border border-blue-100">${author.rol || 'Müşteri'}</span>
                        </h4>
                        <p class="text-[12px] text-slate-400 font-bold mt-0.5">${new Date(post.created_at).toLocaleDateString('tr-TR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</p>
                    </div>
                </div>
                ${postOptionsHTML}
            </div>
            
            <div class="text-slate-900 text-[15px] whitespace-pre-wrap break-words pointer-events-auto leading-relaxed font-medium px-1">${post.metin}</div>
            ${mediaHTML}
            
            <div class="flex items-center gap-6 mt-5 pt-4 border-t border-slate-100 pointer-events-auto px-1">
                <button class="action-btn like-btn flex items-center gap-2 text-[16px] font-extrabold transition-colors outline-none border-none bg-transparent active:scale-90 ${isLikedByMe ? 'text-red-500' : 'text-slate-800 hover:text-red-500'}" data-post-id="${post.id}" data-author-id="${post.user_id}">
                    <i class="${isLikedByMe ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} like-icon" style="pointer-events:none;"></i> <span class="like-count text-[15px]" style="pointer-events:none;">${likesCount > 0 ? likesCount : 'Beğen'}</span>
                </button>
                <button class="action-btn comment-toggle-btn flex items-center gap-2 text-slate-800 hover:text-blue-600 transition-colors text-[16px] font-extrabold outline-none border-none bg-transparent active:scale-90" data-post-id="${post.id}">
                    <i class="fa-regular fa-comment pointer-events-none"></i> <span class="pointer-events-none text-[15px]">${allComments.length > 0 ? allComments.length : 'Yorum'}</span>
                </button>
                <div class="ml-auto flex items-center gap-1.5 text-slate-400 text-[13px] font-extrabold">
                    <i class="fa-solid fa-chart-simple text-[14px]"></i> <span class="view-count-text">${viewCount}</span>
                </div>
            </div>

            <div class="comment-section ${isSingleView ? '' : 'hidden'} mt-5 pt-4 border-t border-slate-100 pointer-events-auto">
                <div class="mb-5 space-y-1">${commentsHTML}</div>
                <div class="reply-indicator hidden items-center justify-between bg-blue-50 text-blue-700 px-4 py-2.5 rounded-t-2xl text-[12px] font-extrabold border border-blue-100 border-b-0">
                    <span><i class="fa-solid fa-reply mr-1.5"></i> <span class="reply-name"></span> kullanıcısına yanıt veriliyor</span>
                    <button class="cancel-reply-btn hover:text-red-500 outline-none border-none bg-transparent active:scale-90"><i class="fa-solid fa-xmark text-lg"></i></button>
                </div>
                <div class="flex gap-2 relative">
                    <img src="${userDataGlobal ? userDataGlobal.avatar_url : 'https://via.placeholder.com/150'}" class="w-11 h-11 rounded-full object-cover border border-slate-200 absolute left-0 top-0 shadow-sm" loading="lazy">
                    <input type="text" class="comment-input flex-1 pl-14 pr-14 py-3 bg-slate-50 border border-slate-200 rounded-full text-[14px] font-medium focus:outline-none focus:border-slate-800 focus:bg-white transition-colors" placeholder="Yorum ekle..." style="outline:none;">
                    <button class="submit-comment-btn absolute right-1.5 top-1.5 w-8 h-8 bg-slate-900 hover:bg-black text-white rounded-full flex items-center justify-center shadow-md transition-transform active:scale-90 outline-none border-none" data-post-id="${post.id}" data-author-id="${post.user_id}">
                        <i class="fa-solid fa-paper-plane pointer-events-none text-[11px] ml-[-1px]"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// BATCH RENDER PERFORMANS GÜNCELLEMESİ
// ============================================
async function loadFeed(filterType) {
    if (!currentUserSession) return;
    const feedList = document.getElementById('feed-list');
    if (!feedList) return;
    feedList.innerHTML = '<div class="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-100 shadow-sm"><i class="fa-solid fa-spinner fa-spin text-5xl mb-4 text-blue-500"></i><p class="font-extrabold text-[15px]">Akış Yükleniyor...</p></div>';
    
    try {
        const { data: myFollows } = await supabase.from('takipler').select('takip_edilen_id').eq('takip_eden_id', currentUserSession.user.id);
        const followedIds = myFollows ? myFollows.map(f => f.takip_edilen_id) : [];
        followedIds.push(currentUserSession.user.id); 

        let query = supabase.from('gonderiler').select(`*, yazar:uyeler(id, ad_soyad, avatar_url, rol, gizli_hesap), etkilesimler(id, user_id), gonderi_yorumlari(id, metin, created_at, user_id, ust_yorum_id, yazar:uyeler(ad_soyad, avatar_url, rol))`).order('created_at', { ascending: false });
        if (filterType !== 'all') query = query.eq('gonderi_tipi', filterType);
        
        const { data: posts, error } = await query;
        if(error) throw error;

        const visiblePosts = posts.filter(p => {
            if (p.yazar && p.yazar.gizli_hesap === true) {
                return followedIds.includes(p.user_id);
            }
            return true;
        });

        if (!visiblePosts || visiblePosts.length === 0) { 
            feedList.innerHTML = '<div class="bg-white p-12 border border-slate-100 rounded-3xl text-center text-slate-400 shadow-sm"><i class="fa-regular fa-images text-6xl mb-5 text-slate-200"></i><p class="font-extrabold text-[15px]">Henüz paylaşım yok.</p></div>'; 
            return; 
        }
        
        feedList.innerHTML = visiblePosts.map(p => generatePostHTML(p, false)).join('');
        
        document.querySelectorAll('.reels-video').forEach(v => reelsObserver.observe(v));
        document.querySelectorAll('.post-card').forEach(c => postViewObserver.observe(c));
    } catch (e) {}
}

// EVENT DELEGATION
document.addEventListener('click', async (e) => {
    if (!currentUserSession) return;
    const target = e.target;
    
    // GÖNDERİ BÜYÜTME (TIRNAK HATASI ÇÖZÜMÜ)
    const gridItem = target.closest('[data-grid-post-id]');
    if (gridItem) {
        openSinglePost(gridItem.getAttribute('data-grid-post-id'));
        return;
    }
    
    const likeBtn = target.closest('.like-btn');
    if (likeBtn) {
        const postCard = likeBtn.closest('.post-card');
        const postId = likeBtn.getAttribute('data-post-id');
        const authorId = likeBtn.getAttribute('data-author-id');
        const icon = postCard.querySelector('.like-icon');
        const countSpan = postCard.querySelector('.like-count');
        const isLiked = icon.classList.contains('fa-solid');
        let currentCount = parseInt(countSpan.innerText) || 0;

        if (isLiked) {
            icon.className = "fa-regular fa-heart like-icon text-slate-800"; 
            likeBtn.classList.replace('text-red-500', 'text-slate-800');
            countSpan.innerText = currentCount > 1 ? currentCount - 1 : 'Beğen';
        } else {
            icon.className = "fa-solid fa-heart like-icon text-red-500"; 
            likeBtn.classList.replace('text-slate-800', 'text-red-500');
            countSpan.innerText = isNaN(currentCount) || currentCount === 0 ? 1 : currentCount + 1;
        }

        try {
            const { data: existingLike } = await supabase.from('etkilesimler').select('id').eq('gonderi_id', postId).eq('user_id', currentUserSession.user.id).single();
            if (existingLike) { await supabase.from('etkilesimler').delete().eq('id', existingLike.id); } 
            else {
                await supabase.from('etkilesimler').insert([{ gonderi_id: postId, user_id: currentUserSession.user.id, etkilesim_tipi: 'like' }]);
                if (authorId !== currentUserSession.user.id) await supabase.from('bildirimler').insert([{ alici_id: authorId, gonderen_id: currentUserSession.user.id, mesaj: 'gönderini beğendi', gonderi_id: postId }]);
            }
        } catch (err) {}
        return;
    }

    const submitCommentBtn = target.closest('.submit-comment-btn');
    if (submitCommentBtn) {
        const postCard = submitCommentBtn.closest('.post-card');
        const postId = submitCommentBtn.getAttribute('data-post-id');
        const authorId = submitCommentBtn.getAttribute('data-author-id');
        const input = postCard.querySelector('.comment-input');
        if (!input.value.trim()) return;
        submitCommentBtn.disabled = true; submitCommentBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        try {
            const parentId = activeReplyData[postId] || null;
            const commentText = input.value.trim();
            
            await supabase.from('gonderi_yorumlari').insert([{ gonderi_id: postId, user_id: currentUserSession.user.id, metin: commentText, ust_yorum_id: parentId }]);
            
            if (authorId !== currentUserSession.user.id) {
                const notifMsg = `gönderine yorum yaptı: ${commentText}`;
                await supabase.from('bildirimler').insert([{ alici_id: authorId, gonderen_id: currentUserSession.user.id, mesaj: notifMsg, gonderi_id: postId }]);
            }
            
            delete activeReplyData[postId]; input.value = '';
            
            const { data: post } = await supabase.from('gonderiler').select(`*, yazar:uyeler(ad_soyad, avatar_url, rol), etkilesimler(id, user_id), gonderi_yorumlari(id, metin, created_at, user_id, ust_yorum_id, yazar:uyeler(ad_soyad, avatar_url, rol))`).eq('id', postId).single();
            postCard.outerHTML = generatePostHTML(post, true);
            const newVideo = document.querySelector(`.post-card[data-post-id="${postId}"] .reels-video`);
            if(newVideo) reelsObserver.observe(newVideo);
            const newCard = document.querySelector(`.post-card[data-post-id="${postId}"]`);
            if(newCard) postViewObserver.observe(newCard);
            
            showToast('success', 'Yorum eklendi!');
        } catch(err) { showToast('error', 'Yorum gönderilemedi.'); } 
        finally { submitCommentBtn.disabled = false; submitCommentBtn.innerHTML = '<i class="fa-solid fa-paper-plane text-[11px] ml-[-1px]"></i>'; }
        return;
    }

    const toggleBtn = target.closest('.comment-toggle-btn');
    if (toggleBtn) {
        const postCard = toggleBtn.closest('.post-card');
        postCard.querySelector('.comment-section').classList.toggle('hidden');
        return;
    }

    const replyBtn = target.closest('.reply-to-comment-btn');
    if (replyBtn) {
        const postCard = replyBtn.closest('.post-card');
        const pId = replyBtn.getAttribute('data-post-id');
        activeReplyData[pId] = replyBtn.getAttribute('data-comment-id');
        const indicator = postCard.querySelector('.reply-indicator');
        indicator.classList.replace('hidden', 'flex');
        indicator.querySelector('.reply-name').innerText = replyBtn.getAttribute('data-author-name');
        postCard.querySelector('.comment-input').focus();
        return;
    }

    const cancelReplyBtn = target.closest('.cancel-reply-btn');
    if (cancelReplyBtn) {
        const postCard = cancelReplyBtn.closest('.post-card');
        const pId = cancelReplyBtn.closest('.reply-indicator').nextElementSibling.querySelector('.submit-comment-btn').getAttribute('data-post-id');
        delete activeReplyData[pId]; 
        postCard.querySelector('.reply-indicator').classList.replace('flex', 'hidden');
        return;
    }

    const deletePostBtn = target.closest('.delete-post-btn');
    if (deletePostBtn) {
        const postId = deletePostBtn.getAttribute('data-post-id');
        // Kaba Swal Pop-up kaldırıldı, direkt toast bildirim ile işlem başlatılır
        deletePostBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin w-4 text-slate-400"></i> Siliniyor...';
        
        await supabase.from('gonderiler').delete().eq('id', postId); 
        showToast('success', 'Gönderi silindi.');
        loadFeed(currentFeedFilter); 
        
        if(currentlyViewingProfileId && !document.getElementById('user-profile-modal').classList.contains('tw-modal-hidden')) {
            openUserProfile(currentlyViewingProfileId);
        }
        if(!document.getElementById('single-post-modal').classList.contains('tw-modal-hidden')) {
            closeSideModal('single-post-modal', 'single-post-panel');
        }
        return;
    }

    const deleteCommentBtn = target.closest('.delete-comment-btn');
    if (deleteCommentBtn) {
        const postCard = deleteCommentBtn.closest('.post-card');
        const commentId = deleteCommentBtn.getAttribute('data-comment-id');
        
        deleteCommentBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        await supabase.from('gonderi_yorumlari').delete().eq('id', commentId); 
        showToast('success', 'Yorum silindi.');
        
        loadFeed(currentFeedFilter); 
        if(currentlyViewingProfileId && !document.getElementById('user-profile-modal').classList.contains('tw-modal-hidden')) {
            openUserProfile(currentlyViewingProfileId);
        }
        if(!document.getElementById('single-post-modal').classList.contains('tw-modal-hidden')) {
            openSinglePost(postCard.getAttribute('data-post-id')); 
        }
        return;
    }

    const editPostBtn = target.closest('.edit-post-btn');
    if (editPostBtn) {
        const postId = editPostBtn.getAttribute('data-post-id');
        const oldText = decodeURIComponent(editPostBtn.getAttribute('data-text'));
        const { value: newText } = await Swal.fire({ input: 'textarea', inputValue: oldText, showCancelButton: true, confirmButtonText: 'Kaydet', cancelButtonText: 'İptal' });
        if (newText && newText !== oldText) { 
            await supabase.from('gonderiler').update({ metin: newText }).eq('id', postId); 
            showToast('success', 'Gönderi düzenlendi.');
            loadFeed(currentFeedFilter); 
        } return;
    }
    
    const fTrigger = target.closest('#follower-trigger');
    if(fTrigger && currentlyViewingProfileId) { openFollowList('followers', currentlyViewingProfileId); return; }
    
    const fingTrigger = target.closest('#following-trigger');
    if(fingTrigger && currentlyViewingProfileId) { openFollowList('following', currentlyViewingProfileId); return; }
});

document.addEventListener('dblclick', async (e) => {
    if (!currentUserSession) return;
    const target = e.target;
    if (target.classList.contains('post-media-item')) {
        if (window.getSelection) { window.getSelection().removeAllRanges(); }
        const postCard = target.closest('.post-card');
        const postId = target.getAttribute('data-post-id');
        const authorId = target.getAttribute('data-author-id');
        
        const bigHeart = postCard.querySelector('.big-heart');
        if (bigHeart) {
            bigHeart.classList.remove('heart-pop'); void bigHeart.offsetWidth; bigHeart.classList.add('heart-pop');
        }

        const icon = postCard.querySelector('.like-icon');
        const countSpan = postCard.querySelector('.like-count');
        const isLiked = icon.classList.contains('fa-solid');
        
        if (!isLiked) {
            let currentCount = parseInt(countSpan.innerText) || 0;
            icon.className = "fa-solid fa-heart like-icon text-red-500";
            postCard.querySelector('.like-btn').classList.replace('text-slate-800', 'text-red-500');
            countSpan.innerText = isNaN(currentCount) || currentCount === 0 ? 1 : currentCount + 1;

            try {
                await supabase.from('etkilesimler').insert([{ gonderi_id: postId, user_id: currentUserSession.user.id, etkilesim_tipi: 'like' }]);
                if (authorId !== currentUserSession.user.id) await supabase.from('bildirimler').insert([{ alici_id: authorId, gonderen_id: currentUserSession.user.id, mesaj: 'gönderini beğendi', gonderi_id: postId }]);
            } catch (err) {}
        }
    }
});

// ============================================
// TAKİP / TAKİPÇİ LİSTESİ MANTIĞI
// ============================================
window.openFollowList = async function(type, userId) {
    openSideModal('follow-list-modal', 'follow-list-panel');
    const title = document.getElementById('follow-list-title');
    const content = document.getElementById('follow-list-content');
    
    title.innerText = type === 'followers' ? 'Takipçiler' : 'Takip Edilenler';
    content.innerHTML = '<div class="text-center p-10"><i class="fa-solid fa-spinner fa-spin text-blue-500 text-4xl"></i></div>';
    
    try {
        let query = supabase.from('takipler').select('takip_eden_id').eq('takip_edilen_id', userId);
        if(type === 'following') query = supabase.from('takipler').select('takip_edilen_id').eq('takip_eden_id', userId);
        
        const {data, error} = await query;
        if(error) throw error;
        
        if(!data || data.length === 0) {
            content.innerHTML = '<div class="flex flex-col items-center justify-center h-40 text-slate-400"><i class="fa-solid fa-user-xmark text-5xl mb-4 opacity-30"></i><p class="font-bold text-[14px]">Liste boş.</p></div>';
            return;
        }
        
        const userIds = data.map(d => type === 'followers' ? d.takip_eden_id : d.takip_edilen_id);
        const {data: users} = await supabase.from('uyeler').select('id, ad_soyad, avatar_url, rol').in('id', userIds);
        
        content.innerHTML = '';
        users.forEach(u => {
            const avatar = u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.ad_soyad)}&background=1e3a8a&color=fff`;
            content.insertAdjacentHTML('beforeend', `
                <div class="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors border border-slate-100 shadow-sm mb-3 user-profile-trigger" data-user-id="${u.id}" onclick="closeSideModal('follow-list-modal', 'follow-list-panel')">
                    <img src="${avatar}" class="w-14 h-14 rounded-full object-cover border-[1.5px] border-slate-200 pointer-events-none shadow-sm" loading="lazy">
                    <div class="pointer-events-none flex-1">
                        <h4 class="font-extrabold text-slate-900 text-[15px]">${u.ad_soyad}</h4>
                        <span class="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase border border-blue-100 mt-1 inline-block">${u.rol}</span>
                    </div>
                </div>
            `);
        });
    } catch(e) {
        content.innerHTML = '<div class="text-center text-red-500 mt-10 font-bold">Liste yüklenemedi.</div>';
    }
};

// ============================================
// PROFİL SAYFASI VE GİZLİ HESAP MANTIĞI
// ============================================
const tabGridBtn = document.getElementById('tab-grid');
const tabQuestionsBtn = document.getElementById('tab-questions');
if(tabGridBtn && tabQuestionsBtn) {
    tabGridBtn.addEventListener('click', () => {
        tabGridBtn.classList.add('border-slate-900', 'text-slate-900'); tabGridBtn.classList.remove('border-transparent', 'text-slate-300');
        tabQuestionsBtn.classList.add('border-transparent', 'text-slate-300'); tabQuestionsBtn.classList.remove('border-slate-900', 'text-slate-900');
        document.getElementById('up-grid').classList.remove('tw-modal-hidden');
        document.getElementById('up-questions-list').classList.add('tw-modal-hidden');
    });
    tabQuestionsBtn.addEventListener('click', () => {
        tabQuestionsBtn.classList.add('border-slate-900', 'text-slate-900'); tabQuestionsBtn.classList.remove('border-transparent', 'text-slate-300');
        tabGridBtn.classList.add('border-transparent', 'text-slate-300'); tabGridBtn.classList.remove('border-slate-900', 'text-slate-900');
        document.getElementById('up-questions-list').classList.remove('tw-modal-hidden');
        document.getElementById('up-grid').classList.add('tw-modal-hidden');
    });
}

window.openUserProfile = async (uId) => {
    if(!uId || uId === 'null' || uId === 'undefined') return;
    currentlyViewingProfileId = uId;
    openSideModal('user-profile-modal', 'user-profile-panel');
    
    if(tabGridBtn) tabGridBtn.click();

    const upGrid = document.getElementById('up-grid');
    const upQuestionsList = document.getElementById('up-questions-list');
    const tabsContainer = document.getElementById('profile-tabs-container');
    const emptyPlaceHolder = document.getElementById('empty-profile-placeholder');
    
    if(upGrid) upGrid.innerHTML = '<div class="col-span-3 text-center p-10"><i class="fa-solid fa-spinner fa-spin text-4xl text-blue-500"></i></div>';
    if(upQuestionsList) upQuestionsList.innerHTML = '<div class="text-center p-10"><i class="fa-solid fa-spinner fa-spin text-4xl text-blue-500"></i></div>';
    if(emptyPlaceHolder) { emptyPlaceHolder.classList.add('hidden'); emptyPlaceHolder.classList.remove('flex'); }
    if(tabsContainer) tabsContainer.style.display = 'flex';

    try {
        const { data: user, error } = await supabase.from('uyeler').select('*').eq('id', uId).single();
        if (error) throw error;
        
        document.getElementById('up-header-name').innerText = user.ad_soyad; 
        document.getElementById('up-name').innerText = user.ad_soyad; 
        document.getElementById('up-role').innerText = user.rol; 
        document.getElementById('up-bio').innerText = user.biyografi || '';
        const userAvatar = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.ad_soyad || 'U')}&background=1e3a8a&color=fff`;
        document.getElementById('up-avatar').src = userAvatar;

        const followBtn = document.getElementById('follow-btn');
        const unfollowBtn = document.getElementById('unfollow-btn');
        const messageUserBtn = document.getElementById('message-user-btn');
        const menuContainer = document.getElementById('my-profile-menu-container');
        const actionsContainer = document.getElementById('up-action-buttons');
        
        let isFollowing = false;
        let isRequested = false;

        if (currentUserSession && uId !== currentUserSession.user.id) {
            const { data: follow } = await supabase.from('takipler').select('id').eq('takip_eden_id', currentUserSession.user.id).eq('takip_edilen_id', uId).maybeSingle();
            if (follow) isFollowing = true;

            if(!isFollowing && user.gizli_hesap) {
                const { data: req } = await supabase.from('takip_istekleri').select('id').eq('gonderen_id', currentUserSession.user.id).eq('alici_id', uId).maybeSingle();
                if (req) isRequested = true;
            }
        }

        if (currentUserSession && uId === currentUserSession.user.id) { 
            if(menuContainer) menuContainer.style.display = 'block';
            if(actionsContainer) actionsContainer.classList.add('tw-modal-hidden');
            isFollowing = true; 
        } else if (currentUserSession) {
            if(menuContainer) menuContainer.style.display = 'none';
            if(actionsContainer) actionsContainer.classList.remove('tw-modal-hidden');
            
            if(messageUserBtn) {
                messageUserBtn.classList.remove('tw-modal-hidden');
                messageUserBtn.onclick = () => { closeSideModal('user-profile-modal', 'user-profile-panel'); openChat(uId, user.ad_soyad, userAvatar); };
            }
            
            if(isFollowing) {
                if(followBtn) followBtn.classList.add('tw-modal-hidden'); 
                if(unfollowBtn) {
                    unfollowBtn.classList.remove('tw-modal-hidden'); 
                    unfollowBtn.innerHTML = 'Takip Ediliyor';
                    unfollowBtn.disabled = false;
                }
            } else if (isRequested) {
                if(followBtn) { 
                    followBtn.classList.remove('tw-modal-hidden'); 
                    followBtn.innerText = 'İstek Gönderildi'; followBtn.disabled = true; followBtn.classList.add('opacity-70');
                }
                if(unfollowBtn) unfollowBtn.classList.add('tw-modal-hidden');
            } else {
                if(followBtn) { 
                    followBtn.classList.remove('tw-modal-hidden'); 
                    followBtn.innerText = user.gizli_hesap ? 'Takip İsteği Gönder' : 'Takip Et'; followBtn.disabled = false; followBtn.classList.remove('opacity-70');
                }
                if(unfollowBtn) unfollowBtn.classList.add('tw-modal-hidden');
            }
        }

        const upFollowerCount = document.getElementById('up-follower-count');
        const upFollowingCount = document.getElementById('up-following-count');
        const { count: fer } = await supabase.from('takipler').select('*', { count: 'exact', head: true }).eq('takip_edilen_id', uId);
        const { count: fing } = await supabase.from('takipler').select('*', { count: 'exact', head: true }).eq('takip_eden_id', uId);
        
        const fTrigger = document.getElementById('follower-trigger');
        const fingTrigger = document.getElementById('following-trigger');

        // GİZLİ HESAP ENGELLEMESİ
        if(user.gizli_hesap && !isFollowing && uId !== currentUserSession?.user?.id) {
            if(tabsContainer) tabsContainer.style.display = 'none';
            if(upGrid) upGrid.innerHTML = '<div class="col-span-3 flex flex-col items-center justify-center p-16 text-slate-500"><div class="w-20 h-20 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mb-5"><i class="fa-solid fa-lock text-4xl text-slate-300"></i></div><h3 class="font-extrabold text-slate-900 text-lg">Bu Hesap Gizli</h3><p class="text-sm mt-1 text-center font-medium">Fotoğraflarını ve videolarını görmek için takip et.</p></div>';
            if(upQuestionsList) upQuestionsList.innerHTML = '';
            document.getElementById('up-post-count').innerText = '-';
            if(upFollowerCount) upFollowerCount.innerText = '-';
            if(upFollowingCount) upFollowingCount.innerText = '-';
            fTrigger.onclick = null; fingTrigger.onclick = null;
            return; 
        }

        if(upFollowerCount) upFollowerCount.innerText = fer || 0; 
        if(upFollowingCount) upFollowingCount.innerText = fing || 0;
        fTrigger.onclick = () => openFollowList('followers', uId);
        fingTrigger.onclick = () => openFollowList('following', uId);

        const { data: posts } = await supabase.from('gonderiler').select(`*, yazar:uyeler(ad_soyad, avatar_url, rol), etkilesimler(id, user_id), gonderi_yorumlari(id, metin, created_at, user_id, ust_yorum_id, yazar:uyeler(ad_soyad, avatar_url, rol))`).eq('user_id', uId).order('created_at', { ascending: false });
        document.getElementById('up-post-count').innerText = posts ? posts.length : 0;
        
        if(upGrid) upGrid.innerHTML = ''; 
        if(upQuestionsList) upQuestionsList.innerHTML = '';

        if(posts && posts.length > 0) {
            posts.forEach(p => {
                // TIKLAMA HATASI BURADA ÇÖZÜLDÜ: onclick="openSinglePost('${p.id}')"
                if (p.gonderi_tipi === 'medya') {
                    let content = p.medya_url.endsWith('.mp4') ? '<div class="absolute inset-0 bg-black flex items-center justify-center text-white"><i class="fa-solid fa-play text-2xl drop-shadow-md"></i><span class="absolute bottom-2 left-2 text-[10px] bg-black/60 font-bold px-1.5 py-0.5 rounded backdrop-blur-sm shadow-sm">Reels</span></div>' : `<img src="${p.medya_url}" class="w-full h-full object-cover">`;
                    if(upGrid) upGrid.insertAdjacentHTML('beforeend', `<div class="aspect-square relative cursor-pointer hover:opacity-90 transition-opacity" data-grid-post-id="${p.id}">${content}</div>`);
                } else { 
                    if(upQuestionsList) upQuestionsList.insertAdjacentHTML('beforeend', generatePostHTML(p, false)); 
                }
            });
            if(upGrid && upGrid.innerHTML === '') upGrid.innerHTML = '<div class="col-span-3 text-center p-10 text-[14px] text-slate-400 font-bold">Medya gönderisi yok.</div>';
            if(upQuestionsList && upQuestionsList.innerHTML === '') upQuestionsList.innerHTML = '<div class="text-center p-10 text-[14px] text-slate-400 font-bold">Soru gönderisi yok.</div>';
        } else {
            if (currentUserSession && uId === currentUserSession.user.id) {
                if(tabsContainer) tabsContainer.style.display = 'none';
                if(emptyPlaceHolder) { emptyPlaceHolder.classList.remove('hidden'); emptyPlaceHolder.classList.add('flex'); }
            } else {
                if(upGrid) upGrid.innerHTML = '<div class="col-span-3 text-center p-10 text-[14px] text-slate-400 font-bold">Henüz gönderisi yok.</div>';
                if(upQuestionsList) upQuestionsList.innerHTML = '<div class="text-center p-10 text-[14px] text-slate-400 font-bold">Henüz gönderisi yok.</div>';
            }
        }
    } catch(e) { console.error('Profil yüklenirken hata:', e); }
};

document.addEventListener('click', async (e) => {
    const trig = e.target.closest('.user-profile-trigger');
    if (trig) {
        const uId = trig.getAttribute('data-user-id');
        if (uId) openUserProfile(uId);
        return;
    }
});

// TAKİP ET & İSTEK GÖNDER
const followBtnEl = document.getElementById('follow-btn');
if(followBtnEl) {
    followBtnEl.addEventListener('click', async () => {
        followBtnEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        followBtnEl.disabled = true;
        try {
            const { data: user } = await supabase.from('uyeler').select('gizli_hesap').eq('id', currentlyViewingProfileId).single();
            if(user && user.gizli_hesap) {
                await supabase.from('takip_istekleri').insert([{ gonderen_id: currentUserSession.user.id, alici_id: currentlyViewingProfileId }]);
                await supabase.from('bildirimler').insert([{ alici_id: currentlyViewingProfileId, gonderen_id: currentUserSession.user.id, mesaj: 'seni takip etmek istiyor' }]);
                followBtnEl.innerHTML = 'İstek Gönderildi'; followBtnEl.classList.add('opacity-70');
                showToast('success', 'Takip isteği gönderildi.');
            } else {
                await supabase.from('takipler').insert([{ takip_eden_id: currentUserSession.user.id, takip_edilen_id: currentlyViewingProfileId }]);
                await supabase.from('bildirimler').insert([{ alici_id: currentlyViewingProfileId, gonderen_id: currentUserSession.user.id, mesaj: 'seni takip etmeye başladı' }]);
                followBtnEl.classList.add('tw-modal-hidden'); followBtnEl.innerHTML = 'Takip Et'; followBtnEl.disabled = false;
                
                const unfollowBtnEl = document.getElementById('unfollow-btn');
                if(unfollowBtnEl) unfollowBtnEl.classList.remove('tw-modal-hidden'); 
                
                const upFollowerCount = document.getElementById('up-follower-count');
                if(upFollowerCount) upFollowerCount.innerText = parseInt(upFollowerCount.innerText)+1;
                showToast('success', 'Takip ediliyor.');
            }
        } catch(e){
            followBtnEl.innerHTML = 'Takip Et'; followBtnEl.disabled = false;
        }
    });
}

// TAKİPTEN ÇIKMA
const unfollowBtnEl = document.getElementById('unfollow-btn');
if(unfollowBtnEl) {
    unfollowBtnEl.addEventListener('click', async () => {
        unfollowBtnEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        unfollowBtnEl.disabled = true;
        
        await supabase.from('takipler').delete().eq('takip_eden_id', currentUserSession.user.id).eq('takip_edilen_id', currentlyViewingProfileId);
        
        unfollowBtnEl.classList.add('tw-modal-hidden'); 
        unfollowBtnEl.innerHTML = 'Takip Ediliyor';
        unfollowBtnEl.disabled = false;
        
        if(followBtnEl) { 
            followBtnEl.classList.remove('tw-modal-hidden'); 
            followBtnEl.innerText = 'Takip Et'; 
            followBtnEl.disabled = false; 
            followBtnEl.classList.remove('opacity-70'); 
        }
        
        const upFollowerCount = document.getElementById('up-follower-count');
        if(upFollowerCount && upFollowerCount.innerText !== '-') {
            upFollowerCount.innerText = Math.max(0, parseInt(upFollowerCount.innerText)-1);
        }
        
        openUserProfile(currentlyViewingProfileId); 
        loadFeed(currentFeedFilter); 
        showToast('info', 'Takipten çıkıldı.');
    });
}

window.openSinglePost = async (postId) => {
    openSideModal('single-post-modal', 'single-post-panel');
    const singlePostContainer = document.getElementById('single-post-container');
    if(singlePostContainer) singlePostContainer.innerHTML = '<div class="text-center mt-20 text-slate-400"><i class="fa-solid fa-spinner fa-spin text-5xl mb-4 text-blue-500"></i><p class="font-bold text-[15px]">Yükleniyor...</p></div>';
    try {
        const { data: post } = await supabase.from('gonderiler').select(`*, yazar:uyeler(ad_soyad, avatar_url, rol), etkilesimler(id, user_id), gonderi_yorumlari(id, metin, created_at, user_id, ust_yorum_id, yazar:uyeler(ad_soyad, avatar_url, rol))`).eq('id', postId).single();
        if(singlePostContainer) {
            singlePostContainer.innerHTML = generatePostHTML(post, true);
            const newVideo = singlePostContainer.querySelector('video');
            if(newVideo) reelsObserver.observe(newVideo);
            const newCard = singlePostContainer.querySelector('.post-card');
            if(newCard) postViewObserver.observe(newCard);
        }
    } catch (e) {}
};

checkSession();

